import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { NotificationService } from '../services/notificationService';
import axios from 'axios';

const CASHFREE_CLIENT_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_CLIENT_SECRET = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_PAYOUT_URL = process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION'
    ? 'https://payout-api.cashfree.com/payout/v1'
    : 'https://payout-gamma.cashfree.com/payout/v1';

// We need a helper for payout auth token as Cashfree Payouts use Bearer tokens
async function getCashfreePayoutToken(): Promise<string> {
    try {
        const response = await axios.post(`${CASHFREE_PAYOUT_URL}/authorize`, {}, {
            headers: {
                'X-Client-Id': CASHFREE_CLIENT_ID,
                'X-Client-Secret': CASHFREE_CLIENT_SECRET,
                'Content-Type': 'application/json'
            }
        });
        if (response.data.status === 'ERROR') throw new Error(response.data.message);
        return response.data.data.token;
    } catch (e: any) {
        throw new Error('Failed to authorize Cashfree Payout API: ' + (e.response?.data?.message || e.message));
    }
}


// ─────────────────────────────────────────────
// GET /api/v1/admin/stats
// ─────────────────────────────────────────────
export const getPlatformStats = async (req: AuthRequest, res: Response) => {
    try {
        const [
            totalUsers, totalAuctions, liveAuctions,
            totalRevenue, openDisputes, flaggedUsers
        ] = await Promise.all([
            prisma.user.count(),
            prisma.auction.count(),
            prisma.auction.count({ where: { status: 'LIVE' } }),
            prisma.escrowPayment.aggregate({ where: { status: 'RELEASED' }, _sum: { platformFee: true } }),
            prisma.dispute.count({ where: { status: 'OPEN' } }),
            prisma.user.count({ where: { suspiciousFlags: { gte: 3 } } })
        ]);

        return res.status(200).json({
            totalUsers, totalAuctions, liveAuctions,
            totalRevenue: Number(totalRevenue._sum.platformFee) || 0,
            openDisputes, flaggedUsers
        });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// GET /api/v1/admin/users
// ─────────────────────────────────────────────
export const getUsers = async (req: AuthRequest, res: Response) => {
    try {
        const { page = '1', limit = '30', search, isSuspended, role } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where: any = {};
        if (search) {
            where.OR = [
                { fullName: { contains: String(search), mode: 'insensitive' } },
                { email: { contains: String(search), mode: 'insensitive' } }
            ];
        }
        if (isSuspended !== undefined) where.isSuspended = isSuspended === 'true';
        if (role) where.role = String(role);

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where, skip, take: Number(limit),
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true, fullName: true, email: true, role: true,
                    verifiedStatus: true, isSuspended: true,
                    suspiciousFlags: true, trustScore: true,
                    walletBalance: true, createdAt: true,
                    _count: { select: { auctionsAsSeller: true, bidsPlaced: true } }
                }
            }),
            prisma.user.count({ where })
        ]);

        return res.status(200).json({
            users,
            pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) }
        });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// PATCH /api/v1/admin/users/:id/suspend
// ─────────────────────────────────────────────
export const suspendUser = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { suspend, reason } = req.body;

        if (id === req.user!.id) return res.status(400).json({ error: 'Cannot suspend yourself' });

        const user = await prisma.$transaction(async (tx) => {
            const updatedUser = await tx.user.update({
                where: { id },
                data: { isSuspended: !!suspend },
                select: { id: true, fullName: true, email: true, isSuspended: true }
            });

            await tx.adminActionLog.create({
                data: {
                    adminId: req.user!.id,
                    action: suspend ? 'USER_SUSPENDED' : 'USER_UNSUSPENDED',
                    targetId: id,
                    targetType: 'USER',
                    notes: reason || 'No reason provided'
                }
            });

            return updatedUser;
        });

        return res.status(200).json({ user, message: `User ${suspend ? 'suspended' : 'restored'} successfully` });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// PATCH /api/v1/admin/users/:id/verify
// ─────────────────────────────────────────────
export const verifyUser = async (req: AuthRequest, res: Response) => {
    try {
        const { verifiedStatus } = req.body;  // 'BASIC' | 'VERIFIED' | 'PREMIUM'

        const user = await prisma.$transaction(async (tx) => {
            const updatedUser = await tx.user.update({
                where: { id: req.params.id },
                data: {
                    verifiedStatus,
                    role: verifiedStatus === 'VERIFIED' || verifiedStatus === 'PREMIUM' ? 'SELLER' : undefined
                },
                select: { id: true, fullName: true, verifiedStatus: true, role: true }
            });

            await tx.adminActionLog.create({
                data: {
                    adminId: req.user!.id,
                    action: `USER_VERIFIED`,
                    targetId: req.params.id,
                    targetType: 'USER',
                    notes: `Verified status set to ${verifiedStatus}`
                }
            });

            return updatedUser;
        });

        return res.status(200).json({ user });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// GET /api/v1/admin/auctions
// ─────────────────────────────────────────────
export const getAdminAuctions = async (req: AuthRequest, res: Response) => {
    try {
        const { status, page = '1', limit = '20' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where: any = {};
        if (status) where.status = String(status);

        const [auctions, total] = await Promise.all([
            prisma.auction.findMany({
                where, skip, take: Number(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    seller: { select: { id: true, fullName: true, email: true } },
                    category: { select: { id: true, name: true } },
                    _count: { select: { bids: true } }
                }
            }),
            prisma.auction.count({ where })
        ]);

        return res.status(200).json({
            auctions,
            pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) }
        });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// DELETE /api/v1/admin/auctions/:id
// ─────────────────────────────────────────────
export const forceRemoveAuction = async (req: AuthRequest, res: Response) => {
    try {
        const { reason } = req.body;

        const auction = await prisma.auction.findUnique({ where: { id: req.params.id } });
        if (!auction) return res.status(404).json({ error: 'Auction not found' });

        await prisma.$transaction(async (tx) => {
            await tx.auction.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } });

            await tx.adminActionLog.create({
                data: {
                    adminId: req.user!.id,
                    action: 'AUCTION_FORCE_REMOVED',
                    targetId: req.params.id,
                    targetType: 'AUCTION',
                    notes: reason || 'Policy violation'
                }
            });
        });

        return res.status(200).json({ message: 'Auction removed by admin' });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// GET /api/v1/admin/withdrawals
// ─────────────────────────────────────────────
export const getPendingWithdrawals = async (req: AuthRequest, res: Response) => {
    try {
        const withdrawals = await prisma.walletTransaction.findMany({
            where: { type: 'WITHDRAWAL', status: 'PENDING' },
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, fullName: true, email: true, trustScore: true, suspiciousFlags: true, verifiedStatus: true } }
            }
        });
        return res.status(200).json({ withdrawals });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// POST /api/v1/admin/withdrawals/:id/approve
// ─────────────────────────────────────────────
export const approveWithdrawal = async (req: AuthRequest, res: Response) => {
    try {
        const transactionId = req.params.id;

        await prisma.$transaction(async (tx) => {
            const transaction = await tx.walletTransaction.findUnique({ where: { id: transactionId }, include: { user: true } });
            if (!transaction || transaction.type !== 'WITHDRAWAL' || transaction.status !== 'PENDING') {
                throw new Error('Invalid or already processed withdrawal request');
            }

            const amount = Math.abs(Number(transaction.amount));

            // --- 🚨 EXECUTE CASHFREE PAYOUT 🚨 ---
            try {
                const token = await getCashfreePayoutToken();

                // For a real production app, the User model would need 'bankAccount', 'ifsc', 'phone'.
                // Using mock data for the test sandbox request
                const transferRequest = {
                    beneId: `bene_${transaction.userId.substring(0, 8)}`,
                    amount: amount,
                    transferId: `txn_${transactionId.substring(0, 10)}_${Date.now()}`,
                    transferMode: 'upi', // 'banktransfer', 'upi', 'paytm'
                    remarks: `Bidora Withdrawal: ${transactionId}`,
                    // Mock bene details (in sandbox, these don't actually move real money)
                    beneficiaryDetails: {
                        beneName: transaction.user.fullName || 'Bidora User',
                        email: transaction.user.email,
                        phone: '9999999999',
                        vpa: 'test@upi'
                    }
                };

                const cfResponse = await axios.post(`${CASHFREE_PAYOUT_URL}/requestAsyncTransfer`, transferRequest, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                });

                if (cfResponse.data.status === 'ERROR') {
                    throw new Error(`Cashfree Payout Failed: ${cfResponse.data.message}`);
                }
            } catch (payoutError: any) {
                // If the bank transfer fails, throw so Prisma aborts the database transaction
                console.error('[Cashfree Payout] Error:', payoutError.response?.data || payoutError.message);
                throw new Error(payoutError.response?.data?.message || payoutError.message || 'Payment Gateway Transfer Failed');
            }
            // ------------------------------------

            // Update transaction
            await tx.walletTransaction.update({
                where: { id: transactionId },
                data: { status: 'COMPLETED', description: `Approved & Transferred via Cashfree` }
            });

            // 1. We ONLY deduct pendingFunds because the available balance was already constrained
            await tx.user.update({
                where: { id: transaction.userId },
                data: { pendingFunds: { decrement: amount } }
            });

            await tx.adminActionLog.create({
                data: {
                    adminId: req.user!.id,
                    action: 'WITHDRAWAL_APPROVED',
                    targetId: transactionId,
                    targetType: 'WALLET_TRANSACTION',
                    notes: `Manually approved and disbursed ₹${amount} via Cashfree`
                }
            });

            // Trigger Notification
            await NotificationService.notifyWithdrawalApproved(transaction.userId, amount);
        });


        return res.status(200).json({ message: 'Withdrawal successfully approved and processed.' });
    } catch (error: any) {
        return res.status(400).json({ error: error.message || 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// POST /api/v1/admin/withdrawals/:id/reject
// ─────────────────────────────────────────────
export const rejectWithdrawal = async (req: AuthRequest, res: Response) => {
    try {
        const transactionId = req.params.id;
        const { reason } = req.body;

        await prisma.$transaction(async (tx) => {
            const transaction = await tx.walletTransaction.findUnique({ where: { id: transactionId } });
            if (!transaction || transaction.type !== 'WITHDRAWAL' || transaction.status !== 'PENDING') {
                throw new Error('Invalid or already processed withdrawal request');
            }

            const absAmount = Math.abs(Number(transaction.amount));

            // Update transaction to FAILED
            await tx.walletTransaction.update({
                where: { id: transactionId },
                data: { status: 'FAILED', description: `Rejected by Admin: ${reason || 'Violation of terms'}` }
            });

            // Refund the user's available balance by reducing their pending freeze
            await tx.user.update({
                where: { id: transaction.userId },
                data: { pendingFunds: { decrement: absAmount } }
            });

            await tx.adminActionLog.create({
                data: {
                    adminId: req.user!.id,
                    action: 'WITHDRAWAL_REJECTED',
                    targetId: transactionId,
                    targetType: 'WALLET_TRANSACTION',
                    notes: `Rejected withdrawal of ${absAmount}: ${reason || 'Violation of terms'}`
                }
            });

            // Trigger Notification
            await NotificationService.notifyWithdrawalRejected(transaction.userId, absAmount, reason || 'Violation of terms');
        });


        return res.status(200).json({ message: 'Withdrawal rejected. Funds refunded to user.' });
    } catch (error: any) {
        return res.status(400).json({ error: error.message || 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// GET /api/v1/admin/logs
// ─────────────────────────────────────────────
export const getActionLogs = async (req: AuthRequest, res: Response) => {
    try {
        const logs = await prisma.adminActionLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: { admin: { select: { id: true, fullName: true } } }
        });
        return res.status(200).json({ logs });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};
