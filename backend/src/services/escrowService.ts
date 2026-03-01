import prisma from '../utils/prisma';
import { Prisma } from '@prisma/client';

export class EscrowService {
    /**
     * Initializes the Escrow Payment holding state.
     * This is part of a larger transaction passing in the Prisma tx client.
     */
    static async initializeEscrow(
        tx: Prisma.TransactionClient,
        auctionId: string,
        buyerId: string,
        sellerId: string,
        amount: number,
        commissionRate: number
    ) {
        const platformFee = amount * (commissionRate / 100);

        // Initial state is HELD. This assumes the buyer has successfully paid.
        await tx.escrowPayment.create({
            data: {
                auctionId,
                buyerId,
                sellerId,
                amount,
                platformFee,
                status: 'HELD'
            }
        });

        // We hold the money in escrow. Log the transaction.
        await tx.walletTransaction.create({
            data: {
                userId: buyerId,
                amount: -amount, // Deduction
                type: 'ESCROW_HELD',
                description: `Funds held in escrow for auction ${auctionId}`
            }
        });
    }

    /**
     * Release the escrow to the seller after they shipped and buyer confirmed delivery, or auto-release window elapsed.
     * Calculate commission and update wallet balance.
     */
    static async releaseEscrow(auctionId: string, txClient?: Prisma.TransactionClient) {
        const executeLogic = async (tx: Prisma.TransactionClient) => {
            const escrow = await tx.escrowPayment.findUnique({
                where: { auctionId }
            });

            if (!escrow || escrow.status !== 'HELD') {
                throw new Error('Escrow payment not found or is not currently held');
            }

            const payoutAmount = Number(escrow.amount) - Number(escrow.platformFee);

            // 1. Release to seller
            await tx.user.update({
                where: { id: escrow.sellerId },
                data: {
                    walletBalance: { increment: payoutAmount }
                }
            });

            // 2. Mark escrow as released
            const updatedEscrow = await tx.escrowPayment.update({
                where: { auctionId },
                data: {
                    status: 'RELEASED',
                    releasedAt: new Date()
                }
            });

            // 3. Mark auction as completed
            await tx.auction.update({
                where: { id: auctionId },
                data: {
                    status: 'COMPLETED'
                }
            });

            // 4. Log transactions
            await tx.walletTransaction.create({
                data: {
                    userId: escrow.sellerId,
                    amount: payoutAmount,
                    type: 'ESCROW_RELEASED',
                    description: `Funds released from escrow for auction ${auctionId}`
                }
            });

            await tx.walletTransaction.create({
                data: {
                    userId: escrow.sellerId, // Or a platform admin account UUID
                    amount: escrow.platformFee,
                    type: 'COMMISSION',
                    description: `Platform commission deducted for auction ${auctionId}`
                }
            });

            return updatedEscrow;
        };

        return txClient ? await executeLogic(txClient) : await prisma.$transaction(executeLogic);
    }

    /**
     * Initiates a dispute for a held escrow payment, preventing it from auto-releasing.
     */
    static async openDispute(auctionId: string, buyerId: string, reason: string) {
        return await prisma.$transaction(async (tx) => {
            const escrow = await tx.escrowPayment.findUnique({
                where: { auctionId }
            });

            if (!escrow || escrow.status !== 'HELD' || escrow.buyerId !== buyerId) {
                throw new Error('Invalid escrow payment for dispute');
            }

            await tx.escrowPayment.update({
                where: { auctionId },
                data: { status: 'DISPUTED' }
            });

            const dispute = await tx.dispute.create({
                data: {
                    auctionId,
                    buyerId,
                    reason,
                    status: 'OPEN'
                }
            });

            // Update auction status
            await tx.auction.update({
                where: { id: auctionId },
                data: { status: 'DISPUTED' }
            });

            return dispute;
        });
    }

    /**
     * Resolves a dispute natively on the platform.
     * Can either refund the buyer or force release to the seller.
     */
    static async resolveDispute(disputeId: string, adminId: string, decision: 'REFUND_BUYER' | 'RELEASE_SELLER', adminNotes: string) {
        return await prisma.$transaction(async (tx) => {
            const dispute = await tx.dispute.findUnique({ where: { id: disputeId }, include: { auction: true } });
            if (!dispute || dispute.status !== 'OPEN') throw new Error('Dispute is not open');

            const escrow = await tx.escrowPayment.findUnique({ where: { auctionId: dispute.auctionId } });
            if (!escrow) throw new Error('Escrow missing');

            let finalEscrowStatus = 'HELD';

            if (decision === 'REFUND_BUYER') {
                await tx.user.update({
                    where: { id: escrow.buyerId },
                    data: { walletBalance: { increment: escrow.amount } }
                });
                finalEscrowStatus = 'REFUNDED';
            } else if (decision === 'RELEASE_SELLER') {
                const payoutAmount = Number(escrow.amount) - Number(escrow.platformFee);
                await tx.user.update({
                    where: { id: escrow.sellerId },
                    data: { walletBalance: { increment: payoutAmount } }
                });
                finalEscrowStatus = 'RELEASED';
            }

            await tx.escrowPayment.update({
                where: { auctionId: dispute.auctionId },
                data: { status: finalEscrowStatus as any }
            });

            return await tx.dispute.update({
                where: { id: disputeId },
                data: {
                    status: decision === 'REFUND_BUYER' ? 'RESOLVED_REFUND_BUYER' : 'RESOLVED_RELEASE_SELLER',
                    adminNotes
                }
            });
        });
    }
}
