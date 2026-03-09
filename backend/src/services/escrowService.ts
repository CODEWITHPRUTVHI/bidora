import prisma from '../utils/prisma';
import { Prisma } from '@prisma/client';
import { ProvenanceService } from './provenanceService';
import { SocialService } from './socialService';

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
     * Patent Candidate 2: Tranche-Based Smart-Escrow Protocol
     * Releases escrow funds in fractions tied to physical logistics events instead of a single binary release.
     */
    static async processLogisticsTranche(
        auctionId: string,
        trancheEvent: 'SHIPPING_SCAN' | 'AUTHENTICATED' | 'DELIVERY_SCAN'
    ) {
        return await prisma.$transaction(async (tx) => {
            const escrow = await tx.escrowPayment.findUnique({
                where: { auctionId }
            });

            if (!escrow || escrow.status !== 'HELD') {
                throw new Error('Escrow payment not found or is not currently held');
            }

            const totalAmount = Number(escrow.amount);
            const platformFee = Number(escrow.platformFee);

            if (trancheEvent === 'SHIPPING_SCAN') {
                // Tranche 1: Release 10% to seller when courier API confirms "In Transit" to cover shipping
                const tranche1Amount = totalAmount * 0.10;

                await tx.user.update({
                    where: { id: escrow.sellerId },
                    data: { walletBalance: { increment: tranche1Amount } }
                });

                await tx.walletTransaction.create({
                    data: {
                        userId: escrow.sellerId,
                        amount: tranche1Amount,
                        type: 'ESCROW_RELEASED',
                        description: `Tranche 1 (10%): Initial release for shipping transit scan on auction ${auctionId}`
                    }
                });

                console.log(`[Escrow Smart Contract] Tranche 1 Released for ${auctionId}`);
                return { tranche: 1, released: tranche1Amount };
            }

            if (trancheEvent === 'AUTHENTICATED') {
                // Tranche 2: Deduct platform commission automatically upon Bidora Authentication Pass
                await tx.walletTransaction.create({
                    data: {
                        userId: escrow.sellerId,
                        amount: platformFee,
                        type: 'COMMISSION',
                        description: `Tranche 2: Platform commission extracted post-authentication for auction ${auctionId}`
                    }
                });

                console.log(`[Escrow Smart Contract] Tranche 2 (Commission) Extracted for ${auctionId}`);
                return { tranche: 2, released: platformFee };
            }

            if (trancheEvent === 'DELIVERY_SCAN') {
                // Tranche 3: Final release is triggered by buyer scanning NFC tag on delivery
                const remainingAmount = totalAmount - (totalAmount * 0.10) - platformFee;

                await tx.user.update({
                    where: { id: escrow.sellerId },
                    data: { walletBalance: { increment: remainingAmount } }
                });

                await tx.walletTransaction.create({
                    data: {
                        userId: escrow.sellerId,
                        amount: remainingAmount,
                        type: 'ESCROW_RELEASED',
                        description: `Tranche 3: Final balance released upon cryptographic delivery scan for ${auctionId}`
                    }
                });

                // Mark Escrow and Auction as Fully Completed
                await tx.escrowPayment.update({
                    where: { auctionId },
                    data: { status: 'RELEASED', releasedAt: new Date() }
                });

                await tx.auction.update({
                    where: { id: auctionId },
                    data: { status: 'COMPLETED' }
                });

                console.log(`[Escrow Smart Contract] Tranche 3 (Final) Released for ${auctionId}`);

                // Broadcast Hype: Successful premium transaction
                prisma.auction.findUnique({
                    where: { id: auctionId },
                    select: { title: true, seller: { select: { fullName: true, avatarUrl: true } } }
                }).then(a => {
                    if (a) {
                        SocialService.broadcastHype({
                            userName: a.seller.fullName,
                            userAvatar: a.seller.avatarUrl,
                            action: 'successfully sold',
                            target: a.title,
                            targetId: auctionId,
                            amount: totalAmount,
                            type: 'WIN'
                        });
                    }
                }).catch(console.error);

                // Generate Provenance (Digital Certificate) asynchronously
                ProvenanceService.generateProvenance(auctionId).catch(err => {
                    console.error(`[Provenance] Failed to generate record for ${auctionId}:`, err);
                });

                return { tranche: 3, released: remainingAmount, completed: true };
            }

            throw new Error('Invalid Tranche Event');
        });
    }

    /**
     * Legacy release method (Bridged for compatibility)
     */
    static async releaseEscrow(auctionId: string) {
        // In a real migration, we would call the tranches sequentially if a legacy system bypassed them
        // For now, assume a legacy call just does the final delivery scan
        return await this.processLogisticsTranche(auctionId, 'DELIVERY_SCAN');
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
