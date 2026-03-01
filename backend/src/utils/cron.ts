import cron from 'node-cron';
import prisma from './prisma';
import { AuctionService } from '../services/auctionService';
import { EscrowService } from '../services/escrowService';
import { NotificationService } from '../services/notificationService';

/**
 * Bidora Background Cron Jobs
 *
 * Job 1 (every 30s): SCHEDULED → LIVE transitions
 * Job 2 (every 30s): LIVE → PAYMENT_PENDING / ENDED transitions
 * Job 3 (every 1h):  PAYMENT_PENDING → CANCELLED (48h timeout)
 * Job 4 (every 1h):  SHIPPED → DELIVERED escrow auto-release (14-day window)
 *
 * Production note: Replace with BullMQ delayed jobs for millisecond precision.
 */
export const initCronJobs = () => {

    // ─────────────────────────────────────────────
    // JOB 1: SCHEDULED → LIVE  (every 30 seconds)
    // ─────────────────────────────────────────────
    cron.schedule('*/30 * * * * *', async () => {
        try {
            const auctionsToGoLive = await prisma.auction.findMany({
                where: {
                    status: 'SCHEDULED',
                    startTime: { lte: new Date() }
                },
                select: { id: true, title: true }
            });

            for (const auction of auctionsToGoLive) {
                try {
                    await prisma.auction.update({
                        where: { id: auction.id },
                        data: { status: 'LIVE' }
                    });
                    console.log(`[Cron] ▶ Auction LIVE: ${auction.id} - ${auction.title}`);
                } catch (err) {
                    console.error(`[Cron] Failed to go live for ${auction.id}:`, err);
                }
            }
        } catch (error) {
            console.error('[Cron] Scheduled→Live error:', error);
        }
    });

    // ─────────────────────────────────────────────
    // JOB 2: LIVE → PAYMENT_PENDING / ENDED  (every 30 seconds)
    // ─────────────────────────────────────────────
    cron.schedule('*/30 * * * * *', async () => {
        try {
            const expiredAuctions = await prisma.auction.findMany({
                where: {
                    status: 'LIVE',
                    endTime: { lte: new Date() }
                },
                select: { id: true, title: true }
            });

            if (expiredAuctions.length === 0) return;

            console.log(`[Cron] Finalizing ${expiredAuctions.length} expired auction(s)...`);

            for (const auction of expiredAuctions) {
                try {
                    const result = await AuctionService.finalizeAuction(auction.id);

                    if (result?.winner) {
                        // Notify winner
                        await NotificationService.notifyAuctionWon(
                            result.winner.bidderId,
                            auction.id,
                            auction.title,
                            Number(result.winner.amount)
                        );
                        await NotificationService.notifyPaymentRequired(
                            result.winner.bidderId,
                            auction.id,
                            auction.title,
                            Number(result.winner.amount)
                        );
                        // Notify seller
                        const fullAuction = await prisma.auction.findUnique({
                            where: { id: auction.id },
                            select: { sellerId: true }
                        });
                        if (fullAuction) {
                            await NotificationService.notifyPaymentReceived(
                                fullAuction.sellerId, auction.id, auction.title
                            );
                        }
                        console.log(`[Cron] ✅ Auction finalized with winner: ${auction.id}`);
                    } else {
                        console.log(`[Cron] ⚠ Auction ended with no valid bids: ${auction.id}`);
                    }
                } catch (err) {
                    console.error(`[Cron] Failed to finalize auction ${auction.id}:`, err);
                }
            }
        } catch (error) {
            console.error('[Cron] Finalize auction error:', error);
        }
    });

    // ─────────────────────────────────────────────
    // JOB 3: PAYMENT_PENDING → CANCELLED after 48h  (every hour)
    // ─────────────────────────────────────────────
    cron.schedule('0 * * * *', async () => {
        try {
            const timeoutHours = Number(process.env.PAYMENT_TIMEOUT_HOURS || 48);
            const cutoffTime = new Date(Date.now() - timeoutHours * 60 * 60 * 1000);

            const timedOutAuctions = await prisma.auction.findMany({
                where: {
                    status: 'PAYMENT_PENDING',
                    updatedAt: { lte: cutoffTime }
                },
                include: {
                    bids: { where: { isWinning: true }, take: 1 },
                    escrowPayment: true
                }
            });

            for (const auction of timedOutAuctions) {
                try {
                    await prisma.$transaction(async (tx) => {
                        // Cancel the auction
                        await tx.auction.update({
                            where: { id: auction.id },
                            data: { status: 'CANCELLED' }
                        });

                        // If escrow was initialized, cancel it
                        if (auction.escrowPayment && auction.escrowPayment.status === 'HELD') {
                            await tx.escrowPayment.update({
                                where: { auctionId: auction.id },
                                data: { status: 'CANCELLED' }
                            });
                        }
                    });

                    // Notify the buyer who failed to pay
                    const winningBid = auction.bids[0];
                    if (winningBid) {
                        await NotificationService.send({
                            userId: winningBid.bidderId,
                            type: 'SYSTEM',
                            title: '⏰ Payment Window Expired',
                            body: `Your payment window for auction "${auction.title}" has expired. The auction has been cancelled.`,
                            referenceId: auction.id
                        });
                    }

                    console.log(`[Cron] 💀 Auction cancelled (payment timeout): ${auction.id}`);
                } catch (err) {
                    console.error(`[Cron] Failed to cancel timed out auction ${auction.id}:`, err);
                }
            }
        } catch (error) {
            console.error('[Cron] Payment timeout error:', error);
        }
    });

    // ─────────────────────────────────────────────
    // JOB 4: Escrow auto-release after 14 days  (every hour)
    // ─────────────────────────────────────────────
    cron.schedule('0 * * * *', async () => {
        try {
            const eligibleEscrows = await prisma.escrowPayment.findMany({
                where: {
                    status: 'HELD',
                    autoReleaseAt: { lte: new Date() }
                },
                include: { auction: { select: { title: true, sellerId: true } } }
            });

            for (const escrow of eligibleEscrows) {
                try {
                    await EscrowService.releaseEscrow(escrow.auctionId);

                    await NotificationService.send({
                        userId: escrow.sellerId,
                        type: 'PAYMENT_RECEIVED',
                        title: '💸 Escrow Auto-Released',
                        body: `Funds for "${escrow.auction.title}" have been automatically released to your wallet.`,
                        referenceId: escrow.auctionId
                    });

                    console.log(`[Cron] 💰 Escrow auto-released: ${escrow.auctionId}`);
                } catch (err) {
                    console.error(`[Cron] Failed to auto-release escrow ${escrow.auctionId}:`, err);
                }
            }
        } catch (error) {
            console.error('[Cron] Escrow auto-release error:', error);
        }
    });

    console.log('⏰ All 4 cron jobs initialized');
};
