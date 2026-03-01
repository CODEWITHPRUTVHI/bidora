import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { qs, qn } from '../utils/queryHelpers';
import { Prisma } from '@prisma/client';

// ─────────────────────────────────────────────
// GET /api/v1/wallet
// ─────────────────────────────────────────────
export const getWallet = async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            select: { walletBalance: true, pendingFunds: true }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const availableBalance = Number(user.walletBalance) - Number(user.pendingFunds);
        return res.status(200).json({
            walletBalance: Number(user.walletBalance),
            pendingFunds: Number(user.pendingFunds),
            availableBalance: parseFloat(availableBalance.toFixed(2))
        });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// GET /api/v1/wallet/transactions
// ─────────────────────────────────────────────
export const getTransactions = async (req: AuthRequest, res: Response) => {
    try {
        const type = qs(req.query.type);
        const page = qn(req.query.page, 1);
        const limit = qn(req.query.limit, 20);
        const skip = (page - 1) * limit;

        const where: Prisma.WalletTransactionWhereInput = { userId: req.user!.id };
        if (type) where.type = type as any;

        const [transactions, total] = await Promise.all([
            prisma.walletTransaction.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
            prisma.walletTransaction.count({ where })
        ]);

        return res.status(200).json({
            transactions,
            pagination: { total, page, limit, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// POST /api/v1/wallet/deposit
// ─────────────────────────────────────────────
export const deposit = async (req: AuthRequest, res: Response) => {
    try {
        const amount = Number(req.body.amount);
        if (!amount || amount <= 0) return res.status(400).json({ error: 'Amount must be positive' });
        if (amount > 500000) return res.status(400).json({ error: 'Maximum deposit is ₹5,00,000' });

        const result = await prisma.$transaction(async (tx) => {
            await tx.walletTransaction.create({
                data: { userId: req.user!.id, amount, type: 'DEPOSIT', status: 'COMPLETED', description: 'Wallet top-up' }
            });
            return tx.user.update({
                where: { id: req.user!.id },
                data: { walletBalance: { increment: amount } },
                select: { walletBalance: true, pendingFunds: true }
            });
        });

        return res.status(200).json({
            message: 'Deposit successful',
            walletBalance: Number(result.walletBalance),
            pendingFunds: Number(result.pendingFunds)
        });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// POST /api/v1/wallet/withdraw
// ─────────────────────────────────────────────
export const withdraw = async (req: AuthRequest, res: Response) => {
    try {
        const amount = Number(req.body.amount);
        if (!amount || amount <= 0) return res.status(400).json({ error: 'Amount must be positive' });

        const result = await prisma.$transaction(async (tx) => {
            // SECURITY ARCHITECTURE: Row-Level Lock
            // Prevents concurrent withdrawals from reading the same stale balance
            const userRows = await tx.$queryRaw<any[]>`SELECT "walletBalance", "pendingFunds", "trustScore", "suspiciousFlags", "verifiedStatus" FROM "User" WHERE id = ${req.user!.id} FOR UPDATE`;
            if (userRows.length === 0) throw new Error('User not found');

            const available = Number(userRows[0].walletBalance) - Number(userRows[0].pendingFunds);
            if (amount > available) {
                throw new Error(`Insufficient available balance. Available: ₹${available.toFixed(2)}`);
            }

            // ── INTELLIGENT AUTO-APPROVAL SYSTEM ─────────────
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

            // Get recent withdrawal volume (WITHDRAWAL amounts are negative)
            const recentWithdrawals = await tx.walletTransaction.aggregate({
                _sum: { amount: true },
                where: {
                    userId: req.user!.id,
                    type: 'WITHDRAWAL',
                    createdAt: { gte: twentyFourHoursAgo }
                }
            });

            const recentVolume = Math.abs(Number(recentWithdrawals._sum.amount || 0));

            const isTrustScoreGood = Number(userRows[0].trustScore) >= 4.0;
            const noSuspiciousFlags = Number(userRows[0].suspiciousFlags) === 0;
            const isVelocitySafe = (recentVolume + amount) <= 50000;
            const isVerified = ['VERIFIED', 'PREMIUM'].includes(userRows[0].verifiedStatus);

            const autoApprove = isTrustScoreGood && noSuspiciousFlags && isVelocitySafe && isVerified;

            if (autoApprove) {
                // Instantly approve & deduct balance (no pending funds needed)
                await tx.walletTransaction.create({
                    data: { userId: req.user!.id, amount: -amount, type: 'WITHDRAWAL', status: 'COMPLETED', description: 'Auto-approved Withdrawal' }
                });
                const updated = await tx.user.update({
                    where: { id: req.user!.id },
                    data: { walletBalance: { decrement: amount } },
                    select: { walletBalance: true, pendingFunds: true }
                });
                return { ...updated, status: 'Completed Instantly', reason: 'Auto-approved' };
            } else {
                // Queue for Manual Review
                const reasons = [];
                if (!isTrustScoreGood) reasons.push('Low Trust Score');
                if (!noSuspiciousFlags) reasons.push('Suspicious Flags active');
                if (!isVelocitySafe) reasons.push('24h velocity limit exceeded');
                if (!isVerified) reasons.push('Account not verified');

                await tx.walletTransaction.create({
                    data: { userId: req.user!.id, amount: -amount, type: 'WITHDRAWAL', status: 'PENDING', description: `Requires Review: ${reasons.join(', ')}` }
                });
                const updated = await tx.user.update({
                    where: { id: req.user!.id },
                    data: { pendingFunds: { increment: amount } },
                    select: { walletBalance: true, pendingFunds: true }
                });
                return { ...updated, status: 'Queued for Review', reason: reasons.join(', ') };
            }
        });

        return res.status(200).json({
            message: result.status === 'Completed Instantly' ? 'Withdrawal processed instantly to your bank account.' : 'Withdrawal request submitted for security review.',
            amountRequested: amount,
            walletBalance: Number(result.walletBalance),
            pendingFunds: Number(result.pendingFunds),
            approvalStatus: result.status
        });
    } catch (error: any) {
        console.error('[Wallet] Withdrawal Error:', error);
        if (error.message.includes('Insufficient')) {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// POST /api/v1/wallet/pay/:auctionId
// ─────────────────────────────────────────────
export const payForAuction = async (req: AuthRequest, res: Response) => {
    try {
        const { auctionId, addressId } = req.body;
        const buyerId = req.user!.id;

        const result = await prisma.$transaction(async (tx) => {
            // 1. Validate auction + find winning bid via separate query
            const auction = await tx.auction.findUnique({ where: { id: auctionId } });
            if (!auction) throw new Error('Auction not found');
            if (auction.status !== 'PAYMENT_PENDING') throw new Error('Auction is not awaiting payment');

            const winningBid = await tx.bid.findFirst({
                where: { auctionId, isWinning: true }
            });
            if (!winningBid || winningBid.bidderId !== buyerId) {
                throw new Error('You are not the winner of this auction');
            }

            // 2. Check buyer balance WITH LOCK to prevent double-spend
            const buyerRows = await tx.$queryRaw<any[]>`SELECT "walletBalance", "pendingFunds" FROM "User" WHERE id = ${buyerId} FOR UPDATE`;
            if (buyerRows.length === 0) throw new Error('Buyer not found');

            const available = Number(buyerRows[0].walletBalance) - Number(buyerRows[0].pendingFunds);
            const totalDue = Number(winningBid.amount) + Number(auction.shippingCost);

            if (available < totalDue) {
                throw new Error(`Insufficient balance. Required: ₹${totalDue.toFixed(2)}, Available: ₹${available.toFixed(2)}`);
            }

            // 3. Deduct from buyer
            await tx.user.update({ where: { id: buyerId }, data: { walletBalance: { decrement: totalDue } } });

            // 4. Log ledger entry
            await tx.walletTransaction.create({
                data: {
                    userId: buyerId,
                    amount: -totalDue,
                    type: 'ESCROW_HELD',
                    status: 'COMPLETED',
                    referenceId: auctionId,
                    description: `Escrow payment for auction: ${auction.title}`
                }
            });

            // 5. Update escrow status
            await tx.escrowPayment.update({ where: { auctionId }, data: { status: 'HELD' } });

            // 6. Transition auction to PAID
            const updated = await tx.auction.update({ where: { id: auctionId }, data: { status: 'PAID' } });

            // 7. Save the Shipping Detail reference if provided
            if (addressId) {
                await tx.shippingDetail.upsert({
                    where: { auctionId },
                    create: { auctionId, buyerAddressId: addressId, status: 'PENDING' },
                    update: { buyerAddressId: addressId }
                });
            }

            return { auction: updated, amountPaid: totalDue };
        });

        return res.status(200).json({
            message: 'Payment successful. Awaiting seller shipment.',
            status: result.auction.status,
            amountPaid: result.amountPaid
        });
    } catch (error: any) {
        console.error('[Wallet] Pay error:', error);
        return res.status(400).json({ error: error.message || 'Payment failed' });
    }
};
