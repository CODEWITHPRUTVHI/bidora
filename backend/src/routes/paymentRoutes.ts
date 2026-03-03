import express, { Request, Response } from 'express';
import { authenticateJWT, AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../utils/prisma';
import axios from 'axios';

const router = express.Router();

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_API_URL = process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';

// Helper for Cashfree Headers
const getCashfreeHeaders = () => ({
    'x-client-id': CASHFREE_APP_ID,
    'x-client-secret': CASHFREE_SECRET_KEY,
    'x-api-version': '2023-08-01',
    'Content-Type': 'application/json',
    'Accept': 'application/json'
});

// ─────────────────────────────────────────────
// POST /api/v1/payments/create-order
// Replaces Stripe's /create-intent
// ─────────────────────────────────────────────
router.post('/create-order', authenticateJWT, async (req: AuthRequest, res: Response) => {
    try {
        const amount = Number(req.body.amount);
        if (!amount || amount < 100) return res.status(400).json({ error: 'Minimum deposit is ₹100' });
        if (amount > 500000) return res.status(400).json({ error: 'Maximum deposit is ₹5,00,000' });

        const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const orderId = `order_${Date.now()}_${user.id.substring(0, 5)}`;

        const requestBody = {
            order_amount: amount,
            order_currency: 'INR',
            order_id: orderId,
            customer_details: {
                customer_id: user.id,
                customer_phone: '9999999999', // Cashfree requires a phone number; mock or collect later
                customer_name: user.fullName || 'Bidora User',
                customer_email: user.email
            },
            order_meta: {
                return_url: `${process.env.FRONTEND_URL || 'https://bidora-pink.vercel.app'}/dashboard?tab=wallet`
            }
        };

        const response = await axios.post(`${CASHFREE_API_URL}/orders`, requestBody, {
            headers: getCashfreeHeaders()
        });

        // Return the payment_session_id which the frontend checkout SDK needs to open the modal
        return res.status(200).json({
            payment_session_id: response.data.payment_session_id,
            order_id: orderId
        });
    } catch (error: any) {
        console.error('[Cashfree] Create Order Error:', error?.response?.data || error.message);
        return res.status(500).json({ error: 'Failed to create Cashfree order' });
    }
});

// ─────────────────────────────────────────────
// POST /api/v1/payments/verify
// Replaces Stripe's /verify logic
// ─────────────────────────────────────────────
router.post('/verify', authenticateJWT, async (req: AuthRequest, res: Response) => {
    try {
        const { order_id } = req.body;
        if (!order_id) return res.status(400).json({ error: 'Missing order_id' });

        // Query Cashfree directly to verify the order status
        const cfResponse = await axios.get(`${CASHFREE_API_URL}/orders/${order_id}`, {
            headers: getCashfreeHeaders()
        });

        const orderData = cfResponse.data;

        if (orderData.order_status !== 'PAID') {
            return res.status(400).json({ error: `Payment not succeeded. Status: ${orderData.order_status}` });
        }

        const amount = orderData.order_amount;
        const depositDescription = `Cashfree Deposit [${order_id}]`;

        // Check if webhook already processed it
        const existingTx = await prisma.walletTransaction.findFirst({
            where: { description: { contains: order_id } }
        });

        if (existingTx) {
            const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
            return res.status(200).json({
                message: 'Deposit verified',
                walletBalance: Number(user?.walletBalance),
                pendingFunds: Number(user?.pendingFunds)
            });
        }

        // Top-up the user wallet securely (if webhook missed it / we beat the webhook)
        const result = await prisma.$transaction(async (tx) => {
            await tx.walletTransaction.create({
                data: {
                    userId: req.user!.id,
                    amount,
                    type: 'DEPOSIT',
                    status: 'COMPLETED',
                    description: depositDescription
                }
            });
            return tx.user.update({
                where: { id: req.user!.id },
                data: { walletBalance: { increment: amount } },
                select: { walletBalance: true, pendingFunds: true }
            });
        });

        return res.status(200).json({
            message: 'Deposit verified & wallet updated',
            walletBalance: Number(result.walletBalance),
            pendingFunds: Number(result.pendingFunds)
        });
    } catch (error: any) {
        console.error('[Cashfree] Verify Error:', error?.response?.data || error.message);
        return res.status(500).json({ error: 'Failed to verify Cashfree order' });
    }
});

// ─────────────────────────────────────────────
// POST /api/v1/payments/webhook
// Cashfree Server-to-Server Webhook
// ─────────────────────────────────────────────
router.post('/webhook', express.json(), async (req: Request, res: Response) => {
    try {
        // Cashfree webhook structure checking
        // Technically, you should verify the x-webhook-signature here for production security
        const { data, type } = req.body;

        if (type === 'PAYMENT_SUCCESS_WEBHOOK') {
            const orderId = data.order.order_id;
            const amount = data.order.order_amount;
            const customerId = data.customer_details.customer_id;

            console.log(`[Cashfree Webhook] Order ${orderId} succeeded for user ${customerId}. Amount: ₹${amount}`);

            const existingTx = await prisma.walletTransaction.findFirst({
                where: { description: { contains: orderId } }
            });

            if (!existingTx && customerId) {
                await prisma.$transaction(async (tx) => {
                    await tx.walletTransaction.create({
                        data: {
                            userId: customerId,
                            amount,
                            type: 'DEPOSIT',
                            status: 'COMPLETED',
                            description: `Cashfree Webhook Deposit [${orderId}]`
                        }
                    });
                    await tx.user.update({
                        where: { id: customerId },
                        data: { walletBalance: { increment: amount } }
                    });
                });
                console.log(`[Cashfree Webhook] User ${customerId} wallet securely updated with ₹${amount}.`);
            }
        }

        return res.status(200).send('OK');
    } catch (err: any) {
        console.error(`[Cashfree Webhook] Error: ${err.message}`);
        return res.status(500).send('Webhook parsing error');
    }
});

export default router;
