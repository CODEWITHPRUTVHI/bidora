import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';

export class WalletService {
    /**
     * Get the absolute source of truth for a user's balance by summing the ledger.
     * This is used for periodic audits or sensitive operations.
     */
    static async getCalculatedBalance(userId: string, tx?: Prisma.TransactionClient): Promise<number> {
        const client = tx || prisma;
        const result = await client.walletTransaction.aggregate({
            _sum: { amount: true },
            where: {
                userId,
                status: 'COMPLETED'
            }
        });
        return Number(result._sum.amount || 0);
    }

    /**
     * Blocks funds for an active bid.
     * Increases pendingFunds to prevent double-spending on multiple concurrent auctions.
     */
    static async blockFundsForBid(userId: string, amount: number, tx: Prisma.TransactionClient): Promise<void> {
        // 1. Lock user row
        const user = await tx.user.findUnique({
            where: { id: userId },
            select: { walletBalance: true, pendingFunds: true }
        });

        if (!user) throw new Error('User not found');

        const available = Number(user.walletBalance) - Number(user.pendingFunds);
        if (available < amount) {
            throw new Error(`Insufficient funds to block ₹${amount}. Available: ₹${available}`);
        }

        // 2. Increment pending
        await tx.user.update({
            where: { id: userId },
            data: { pendingFunds: { increment: amount } }
        });
    }

    /**
     * Releases blocked funds when outbid.
     */
    static async releaseBlockedFunds(userId: string, amount: number, tx: Prisma.TransactionClient): Promise<void> {
        await tx.user.update({
            where: { id: userId },
            data: { pendingFunds: { decrement: amount } }
        });
    }

    /**
     * Finalizes a payment. Moves money from Balance+Pending to the platform/escrow ledger.
     */
    static async processWinningPayment(userId: string, amount: number, auctionId: string, tx: Prisma.TransactionClient): Promise<void> {
        // 1. Create Ledger Entry
        await tx.walletTransaction.create({
            data: {
                userId,
                amount: -amount,
                type: 'ESCROW_HELD',
                status: 'COMPLETED',
                referenceId: auctionId,
                description: `Auction Win Finalized: ${auctionId}`
            }
        });

        // 2. Deduct from Balance and Clear it from Pending (assuming it was blocked)
        await tx.user.update({
            where: { id: userId },
            data: {
                walletBalance: { decrement: amount },
                pendingFunds: { decrement: amount }
            }
        });
    }

    /**
     * Top-up wallet (Deposit)
     */
    static async deposit(userId: string, amount: number, referenceId?: string): Promise<any> {
        return await prisma.$transaction(async (tx) => {
            const transaction = await tx.walletTransaction.create({
                data: {
                    userId,
                    amount,
                    type: 'DEPOSIT',
                    status: 'COMPLETED',
                    referenceId,
                    description: 'Wallet Deposit'
                }
            });

            const user = await tx.user.update({
                where: { id: userId },
                data: { walletBalance: { increment: amount } },
                select: { walletBalance: true, pendingFunds: true }
            });

            return { transaction, user };
        });
    }
}
