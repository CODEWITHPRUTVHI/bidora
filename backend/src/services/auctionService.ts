import prisma from '../utils/prisma';
import { Prisma } from '@prisma/client';
import { EscrowService } from './escrowService';
import { io } from './websocketService';
import { FraudService } from './fraudService';
import { WalletService } from './walletService';
import { rescheduleAuctionEnd } from './queueService';
import { CacheService } from './cacheService';
import { SocialService } from './socialService';


const ANTI_SNIPE_WINDOW_SECONDS = 10;
const ANTI_SNIPE_EXTENSION_SECONDS = 10;

export class AuctionService {

    /**
     * Minimum bid increment based on current price tier.
     */
    static getMinIncrement(currentBid: number): number {
        const bid = Number(currentBid);
        // Round to nearest 10 or 100 for "accurate" platform feel usually preferred in India
        if (bid <= 1000) return Math.ceil((bid * 0.05) / 10) * 10 || 50;
        if (bid <= 5000) return Math.ceil((bid * 0.03) / 10) * 10;
        if (bid <= 20000) return Math.ceil((bid * 0.02) / 50) * 50;
        if (bid <= 50000) return Math.ceil((bid * 0.015) / 100) * 100;
        return Math.ceil((bid * 0.01) / 100) * 100;
    }

    /**
     * Places a bid atomically. Returns bid result.
     * Used internally and by REST fallback.
     */
    static async placeBid(auctionId: string, bidderId: string, amount: number) {
        const { result } = await this._placeBidCore(auctionId, bidderId, amount);

        FraudService.analyzeForShillBidding(auctionId).catch(console.error);

        return result;
    }



    /**
     * Places a bid and also returns the previous highest bidder info
     * so WebSocket can notify them of being outbid.
     */
    static async placeBidWithOutbidInfo(auctionId: string, bidderId: string, amount: number) {
        const result = await this._placeBidCore(auctionId, bidderId, amount);

        // Live Social Hype: Broadcast significant bids (e.g., > ₹500)
        if (amount >= 500) {
            prisma.user.findUnique({
                where: { id: bidderId },
                select: { fullName: true, avatarUrl: true }
            }).then(bidder => {
                if (bidder) {
                    SocialService.broadcastHype({
                        userName: bidder.fullName,
                        userAvatar: bidder.avatarUrl,
                        action: 'placed a bid on',
                        target: result.result.updatedAuction.title,
                        targetId: auctionId,
                        amount: amount,
                        type: 'BID'
                    });
                }
            }).catch(console.error);
        }

        // Asynchronously check for shill bidding after a successful bid
        // We do not await this to avoid blocking the bid response time
        FraudService.analyzeForShillBidding(auctionId).catch(console.error);

        return result;
    }

    /**
     * Core atomic bid logic. Always wrapped in a Prisma transaction.
     */
    private static async _placeBidCore(auctionId: string, bidderId: string, amount: number) {
        // Find the current winning bidder BEFORE the transaction
        const previousWinningBid = await prisma.bid.findFirst({
            where: { auctionId, isWinning: true },
            select: { bidderId: true, amount: true }
        });

        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Acquire an exclusive row-level lock via PostgreSQL BEFORE reading.
            // This decisively fixes the "Ghost Bid" and double outbid race condition
            // when multiple concurrent network requests hit at the exact same millisecond.
            await tx.$executeRaw`SELECT 1 FROM "Auction" WHERE "id" = ${auctionId} FOR UPDATE`;

            // 2. Read the precisely locked auction state
            const auction = await tx.auction.findUnique({
                where: { id: auctionId },
                select: { id: true, title: true, currentHighestBid: true, endTime: true, status: true, sellerId: true, bidIncrement: true, startingPrice: true, buyItNowPrice: true }
            });

            if (!auction) throw new Error('Auction not found');
            if (auction.status !== 'LIVE') throw new Error('Auction is not live');
            if (new Date() > new Date(auction.endTime)) throw new Error('Auction has ended');
            if (bidderId === auction.sellerId) throw new Error('Sellers cannot bid on their own auctions');

            // 3. Prevent bidding on your own leading bid
            const currentBid = Number(auction.currentHighestBid);
            if (previousWinningBid && previousWinningBid.bidderId === bidderId) {
                throw new Error('You are already the highest bidder');
            }

            // 4. Validate minimum increment and "Multiple-of-Increment" rule
            const dynamicInc = AuctionService.getMinIncrement(currentBid || Number(auction.startingPrice));
            const increment = Math.max(dynamicInc, Number(auction.bidIncrement || 0));
            const minRequired = currentBid > 0
                ? currentBid + increment
                : Number(auction.startingPrice);

            if (amount < minRequired) {
                throw new Error(`Minimum bid is ₹${minRequired.toLocaleString()} (Current: ₹${currentBid.toLocaleString()})`);
            }

            // Ensure the bid is a step of the increment (e.g. 1100, 1200, 1500)
            if (currentBid > 0) {
                const diff = amount - currentBid;
                if (Math.round(diff) % Math.round(increment) !== 0) {
                    throw new Error(`Bids must be in exact multiples of the increment (₹${increment.toLocaleString()}) above the current price.`);
                }
            }

            // 4. Fraud check & Balance check
            await FraudService.assertUserCanBid(bidderId, amount, auctionId);


            // ── NEW: FINANCIAL INTEGRITY LAYER ─────────────────
            // A. Block funds for the NEW highest bidder
            await WalletService.blockFundsForBid(bidderId, amount, tx);

            // B. Release funds for the PREVIOUS highest bidder (if any)
            if (previousWinningBid) {
                await WalletService.releaseBlockedFunds(
                    previousWinningBid.bidderId,
                    Number(previousWinningBid.amount),
                    tx
                );
            }
            // ──────────────────────────────────────────────────

            // 5. Dynamic Velocity-Based Anti-Sniping (Patent Candidate 1)
            let newEndTime = new Date(auction.endTime);
            let forceCompletion = false;

            if (auction.buyItNowPrice && amount >= Number(auction.buyItNowPrice)) {
                forceCompletion = true;
                amount = Number(auction.buyItNowPrice);
                newEndTime = new Date(); // End immediately
            }

            const timeRemaining = (newEndTime.getTime() - Date.now()) / 1000;
            let extended = false;

            if (!forceCompletion && timeRemaining <= ANTI_SNIPE_WINDOW_SECONDS) {
                // Calculate Bid Velocity (V) and Bidder Density (D) in the last 15 seconds
                const fifteenSecondsAgo = new Date(Date.now() - 15000);
                const recentBids = await tx.bid.findMany({
                    where: {
                        auctionId,
                        createdAt: { gte: fifteenSecondsAgo }
                    },
                    select: { bidderId: true }
                });

                const bidVelocity = recentBids.length + 1; // Include this current bid
                const uniqueBidders = new Set(recentBids.map(b => b.bidderId));
                uniqueBidders.add(bidderId);
                const bidderDensity = uniqueBidders.size;

                // Dynamic Extension Logic
                let dynamicExtensionSeconds = ANTI_SNIPE_EXTENSION_SECONDS; // Default 10s

                if (bidVelocity > 5 && bidderDensity > 2) {
                    // High contention: Calculate longer extension based on density
                    dynamicExtensionSeconds = Math.min(60, 10 + (bidVelocity * 2) + (bidderDensity * 5));
                } else if (bidVelocity > 2) {
                    // Medium contention
                    dynamicExtensionSeconds = 20;
                }

                newEndTime = new Date(newEndTime.getTime() + dynamicExtensionSeconds * 1000);
                extended = true;

                console.log(`[Anti-Snipe Dynamic] Auction ${auctionId}: V=${bidVelocity}, D=${bidderDensity} -> Extended by ${dynamicExtensionSeconds}s`);
            }

            // 6. Unset previous winning bid flag
            await tx.bid.updateMany({
                where: { auctionId, isWinning: true },
                data: { isWinning: false }
            });

            // 7. Update auction currentHighestBid
            const updatedAuction = await tx.auction.update({
                where: { id: auctionId },
                data: {
                    currentHighestBid: amount,
                    endTime: newEndTime,
                    bidCount: { increment: 1 }
                }
            });

            // 8. Create the new bid record
            const bid = await tx.bid.create({
                data: { auctionId, bidderId, amount, isWinning: true }
            });

            // ── NEW: MICRO-CACHING ────────────────────────────
            await CacheService.setAuctionState(auctionId, {
                currentHighestBid: amount,
                endTime: newEndTime.toISOString(),
                bidCount: updatedAuction.bidCount
            });
            // ──────────────────────────────────────────────────

            // 8. Trigger auto-bid cascade (non-recursive, handled below)
            return { bid, updatedAuction, extended, forceCompletion };
        });

        // ── NEW: PRECISION RESCHEDULING ───────────────────
        if (result.extended || result.forceCompletion) {
            await rescheduleAuctionEnd(auctionId, result.updatedAuction.endTime);
        }
        // ──────────────────────────────────────────────────

        // Trigger auto-bid cascade OUTSIDE the transaction to avoid nested tx issues
        await this._triggerAutoBid(auctionId, bidderId, amount);

        return {
            result,
            previousHighestBidderId: previousWinningBid?.bidderId || null,
            previousHighestBid: previousWinningBid ? Number(previousWinningBid.amount) : 0
        };
    }

    /**
     * Auto-bid cascade: Check if any other bidder has an active auto-bid
     * that can outbid the current amount, and fire it.
     */
    private static async _triggerAutoBid(auctionId: string, lastBidderId: string, lastAmount: number) {
        try {
            const autoBids = await prisma.autoBid.findMany({
                where: {
                    auctionId,
                    isActive: true,
                },
                orderBy: { maxAmount: 'desc' }
            });

            // Filter out the person who just bid (they are currently winning)
            const competingAutoBids = autoBids.filter(ab => ab.bidderId !== lastBidderId);

            if (competingAutoBids.length === 0) return;

            const topAutoBid = competingAutoBids[0];

            // SECURITY ARCHITECTURE: Event Loop Throttling
            // To prevent Node.js call stack explosion (Maximum Call Stack Exceeded) 
            // during a fierce "auto-bid battle" between two concurrent high-rollers, 
            // we offload the next cycle to the JS event loop with a 50ms throttle.
            // This provides a smooth "machine-gun" visual effect on the frontend instead of a server crash.
            setTimeout(async () => {
                const auction = await prisma.auction.findUnique({
                    where: { id: auctionId },
                    select: { currentHighestBid: true, status: true, endTime: true }
                });

                if (!auction || auction.status !== 'LIVE') return;

                const minIncrement = AuctionService.getMinIncrement(Number(auction.currentHighestBid));
                const counterAmount = Number(auction.currentHighestBid) + minIncrement;

                if (counterAmount <= Number(topAutoBid.maxAmount)) {
                    console.log(`[AutoBid] Firing auto-bid: ${topAutoBid.bidderId} → ₹${counterAmount} for auction ${auctionId}`);

                    const result = await AuctionService.placeBid(auctionId, topAutoBid.bidderId, counterAmount);

                    // Broadcast auto-bid to the auction room
                    if (io) {
                        io.to(auctionId).emit('new_bid', {
                            auctionId,
                            highestBid: counterAmount,
                            bidderId: topAutoBid.bidderId,
                            isAutoBid: true,
                            timestamp: result.bid.createdAt
                        });
                    }
                } else {
                    // Auto-bid limit exceeded → deactivate
                    await prisma.autoBid.update({
                        where: { id: topAutoBid.id },
                        data: { isActive: false }
                    });
                    console.log(`[AutoBid] Limit reached, deactivating auto-bid for ${topAutoBid.bidderId}`);

                    // Trigger evaluation again in case the second-highest person still has room
                    await AuctionService._triggerAutoBid(auctionId, lastBidderId, lastAmount);
                }
            }, 50);
        } catch (error) {
            console.error('[AutoBid] Cascade error:', error);
        }
    }

    /**
     * Completes an expired auction, selecting the winner and transitioning to PAYMENT_PENDING.
     * Idempotent — safe to call multiple times.
     */
    static async finalizeAuction(auctionId: string) {
        return await prisma.$transaction(async (tx) => {
            const auction = await tx.auction.findUnique({
                where: { id: auctionId },
                include: { bids: { orderBy: { amount: 'desc' }, take: 1 } }
            });

            if (!auction || auction.status !== 'LIVE') return null;
            if (new Date() < new Date(auction.endTime)) return null; // Not yet expired

            const highestBid = auction.bids[0];
            const reserveMet = auction.reservePrice
                ? highestBid && Number(highestBid.amount) >= Number(auction.reservePrice)
                : true;

            let finalStatus: any = 'ENDED';

            if (highestBid && reserveMet) {
                finalStatus = 'PAYMENT_PENDING';

                // Mark winning bid
                await tx.bid.update({ where: { id: highestBid.id }, data: { isWinning: true } });

                // Initialize Escrow in HELD state
                await EscrowService.initializeEscrow(
                    tx,
                    auctionId,
                    highestBid.bidderId,
                    auction.sellerId,
                    Number(highestBid.amount),
                    Number(auction.commissionRate)
                );

                // AUTOMATIC ESCROW TRANSFER: If funds were blocked (which they are), finalize the payment
                // This moves funds from WalletBalance + PendingFunds -> WalletTransaction (ESCROW_HELD)
                try {
                    await WalletService.processWinningPayment(
                        highestBid.bidderId,
                        Number(highestBid.amount),
                        auctionId,
                        tx
                    );
                    // If payment processed successfully, we can skip the manual payment step
                    // finalStatus = 'PAID'; // UNCOMMENT if you want instant settlement. 
                    // For now keeping PAYMENT_PENDING for audit trail, but funds are already moved.
                } catch (walletError) {
                    console.error('[AuctionFinalize] Automatic wallet deduction failed:', walletError);
                    // We fall back to standard flow (user must pay manually if auto-deduct fails)
                }


                // Deactivate all auto-bids for this auction
                await tx.autoBid.updateMany({ where: { auctionId }, data: { isActive: false } });
            }

            const updatedAuction = await tx.auction.update({
                where: { id: auctionId },
                data: { status: finalStatus }
            });

            return {
                auction: updatedAuction,
                winner: (highestBid && reserveMet) ? highestBid : null
            };
        });
    }
}
