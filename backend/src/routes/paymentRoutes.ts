import express, { Request, Response } from 'express';
import { authenticateJWT, AuthRequest } from '../middlewares/authMiddleware';
import Stripe from 'stripe';
import prisma from '../utils/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
    apiVersion: '2025-01-27.acacia' as any
});

const router = express.Router();
export const stripeWebhookRouter = express.Router();

// ─────────────────────────────────────────────
// POST /api/v1/payments/webhook
// This route handles secure callbacks directly from Stripe servers.
// It bypasses the global express.json() parser to maintain the raw body needed for signature verification.
// ─────────────────────────────────────────────
stripeWebhookRouter.post('/', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
    const rawBody = req.body; // Buffer from express.raw()
    const signature = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('Missing STRIPE_WEBHOOK_SECRET environment variable.');
        return res.status(400).send('Webhook configured improperly.');
    }

    let event: Stripe.Event;

    try {
        // Construct the Stripe event, verifying the cryptographic signature
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
        console.error(`[Webhook] Signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Process the event
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const userId = paymentIntent.metadata.userId;
        const amount = paymentIntent.amount / 100; // Convert from paise back to INR

        console.log(`[Webhook] PaymentIntent ${paymentIntent.id} succeeded for user ${userId}. Amount: ₹${amount}`);

        try {
            // Idempotency: Make sure we haven't already processed this payment
            const existingTx = await prisma.walletTransaction.findFirst({
                where: { description: { contains: paymentIntent.id } }
            });

            if (!existingTx && userId) {
                // Top-up the user wallet securely
                await prisma.$transaction(async (tx) => {
                    await tx.walletTransaction.create({
                        data: {
                            userId: userId,
                            amount,
                            type: 'DEPOSIT',
                            status: 'COMPLETED',
                            description: `Stripe Deposit Webhook [${paymentIntent.id}]`
                        }
                    });
                    await tx.user.update({
                        where: { id: userId },
                        data: { walletBalance: { increment: amount } }
                    });
                });
                console.log(`[Webhook] User ${userId} wallet securely updated with ₹${amount}.`);
            } else {
                console.log(`[Webhook] Payment ${paymentIntent.id} already processed or missing userId.`);
            }
        } catch (dbError) {
            console.error(`[Webhook] Database update failed for payment ${paymentIntent.id}:`, dbError);
            return res.status(500).send('Database error during processing');
        }
    }

    // Acknowledge receipt of the event instantly
    return res.status(200).json({ received: true });
});

// ─────────────────────────────────────────────
// POST /api/v1/payments/create-intent
// ─────────────────────────────────────────────
router.post('/create-intent', authenticateJWT, async (req: AuthRequest, res: Response) => {
    try {
        const amount = Number(req.body.amount);
        if (!amount || amount < 100) return res.status(400).json({ error: 'Minimum deposit is ₹100' });
        if (amount > 500000) return res.status(400).json({ error: 'Maximum deposit is ₹5,00,000' });

        // Stripe expects amount in smallest currency unit (paise for INR, cents for USD)
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100,
            currency: 'inr',
            metadata: { userId: req.user!.id }
        });

        return res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
        console.error('[Stripe] Create Intent Error:', error);
        return res.status(500).json({ error: error.message || 'Internal Stripe error' });
    }
});

// ─────────────────────────────────────────────
// POST /api/v1/payments/verify
// ─────────────────────────────────────────────
router.post('/verify', authenticateJWT, async (req: AuthRequest, res: Response) => {
    try {
        const { paymentIntentId } = req.body;
        if (!paymentIntentId) return res.status(400).json({ error: 'Missing paymentIntentId' });

        // Verify the intent directly with Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({ error: `Payment not succeeded. Status: ${paymentIntent.status}` });
        }

        const amount = paymentIntent.amount / 100; // convert back from paise

        // Check if this payment intent was already processed (either by the webhook or a previous frontend ping)
        const existingTx = await prisma.walletTransaction.findFirst({
            where: { description: { contains: paymentIntentId } }
        });

        if (existingTx) {
            // If the webhook already processed it, we just return the latest wallet data cheerfully!
            const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
            return res.status(200).json({
                message: 'Deposit verified by Webhook',
                walletBalance: Number(user?.walletBalance),
                pendingFunds: Number(user?.pendingFunds)
            });
        }

        // Top-up the user wallet
        const result = await prisma.$transaction(async (tx) => {
            await tx.walletTransaction.create({
                data: {
                    userId: req.user!.id,
                    amount,
                    type: 'DEPOSIT',
                    status: 'COMPLETED',
                    description: `Stripe Deposit [${paymentIntentId}]`
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
        console.error('[Stripe] Verify Error:', error);
        return res.status(500).json({ error: 'Failed to verify payment intent' });
    }
});

export default router;
