import prisma from '../utils/prisma';

export class FraudService {
    /**
     * Determine if a user is eligible to bid.
     * Converts Decimal fields to Number() for arithmetic since we're using PostgreSQL + Prisma Decimal type.
     */
    static async assertUserCanBid(userId: string, bidAmount: number, auctionId: string): Promise<void> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { walletBalance: true, pendingFunds: true, suspiciousFlags: true, trustScore: true, isSuspended: true }
        });

        if (!user) throw new Error('User not found');

        // 1. Hard suspension check
        if (user.isSuspended) throw new Error('Your account is suspended. You cannot bid.');

        // 2. Flag count check
        if (user.suspiciousFlags >= 5) throw new Error('Your account has too many suspicious flags.');

        // 3. Trust score check (Decimal → Number comparison)
        if (Number(user.trustScore) < 2.0) throw new Error('Your trust score is too low to bid on auctions.');

        // 4. Balance eligibility (Strict: Must have 100% of bid amount in liquid balance)
        const availableBalance = Number(user.walletBalance) - Number(user.pendingFunds);

        if (availableBalance < bidAmount) {
            throw new Error(`Insufficient balance. You need ₹${bidAmount}, but you only have ₹${availableBalance} available.`);
        }
    }

    /**
     * Increment suspicious flag counter and optionally suspend at threshold.
     */
    static async flagUser(userId: string, reason: string, eventType: import('@prisma/client').FraudEventType = 'RAPID_BIDDING', auctionId?: string): Promise<void> {
        const updated = await prisma.user.update({
            where: { id: userId },
            data: { suspiciousFlags: { increment: 1 } },
            select: { suspiciousFlags: true }
        });

        // Auto-suspend at 5 flags
        if (updated.suspiciousFlags >= 5) {
            await prisma.user.update({
                where: { id: userId },
                data: { isSuspended: true }
            });
        }

        // Log as fraud event
        await prisma.fraudEvent.create({
            data: {
                userId,
                eventType,
                auctionId,
                metadata: { reason },
                riskScore: 90.0 // Default high risk for flagged events
            }
        });

        console.warn(`[FraudService] User ${userId} flagged (${updated.suspiciousFlags} flags). Reason: ${reason}`);
    }

    /**
     * Patent Candidate 3: Real-Time Interaction-Graph Fraud Detection
     * Analyzes latency, cadence, and seller-bidder interaction density to detect Shill Bidding.
     */
    static async analyzeForShillBidding(auctionId: string): Promise<boolean> {
        try {
            const auction = await prisma.auction.findUnique({
                where: { id: auctionId },
                include: {
                    bids: {
                        orderBy: { createdAt: 'desc' },
                        take: 10,
                        select: { bidderId: true, createdAt: true, amount: true }
                    }
                }
            });

            if (!auction || auction.bids.length < 3) return false;

            const latestBid = auction.bids[0];
            const bidderId = latestBid.bidderId;
            const sellerId = auction.sellerId;

            // 1. Latency & Cadence Tracking
            // Calculate millisecond latency between the last 3 bids
            let cadenceAnomalyScore = 0;
            if (auction.bids.length >= 3) {
                const latency1 = auction.bids[0].createdAt.getTime() - auction.bids[1].createdAt.getTime();
                const latency2 = auction.bids[1].createdAt.getTime() - auction.bids[2].createdAt.getTime();

                // If latency is extremely low (bot-like) or identical (scripted), increase anomaly score
                if (latency1 < 500) cadenceAnomalyScore += 50;
                if (Math.abs(latency1 - latency2) < 100) cadenceAnomalyScore += 30; // Suspiciously rhythmic
            }

            // 2. Interaction Mapping (Seller-Bidder Edge Weight)
            // Calculate how often this bidder interacts with this specific seller
            const allBidsByBidder = await prisma.bid.findMany({
                where: { bidderId },
                select: { auction: { select: { sellerId: true } }, isWinning: true }
            });

            const totalBids = allBidsByBidder.length;
            const bidsOnThisSeller = allBidsByBidder.filter(b => b.auction.sellerId === sellerId).length;
            const winsOnThisSeller = allBidsByBidder.filter(b => b.auction.sellerId === sellerId && b.isWinning).length;

            let interactionEdgeWeight = 0;

            if (totalBids > 5) {
                const affinityPercentage = bidsOnThisSeller / totalBids;
                const winRate = winsOnThisSeller / bidsOnThisSeller;

                // High affinity (bids almost exclusively on this seller) + Low win rate (drives up price but never buys)
                if (affinityPercentage > 0.7 && winRate < 0.1) {
                    interactionEdgeWeight += 80;
                } else if (affinityPercentage > 0.5) {
                    interactionEdgeWeight += 40;
                }
            }

            // 3. Shadow Banning / Flagging Logic
            const totalFraudScore = cadenceAnomalyScore + interactionEdgeWeight;

            if (totalFraudScore >= 80) {
                console.log(`[Interaction Graph] Shill Bidding Detected! Bidder: ${bidderId}, Score: ${totalFraudScore}`);

                await FraudService.flagUser(
                    bidderId,
                    `Interaction Graph Flag: Cadence Anomaly (${cadenceAnomalyScore}) + Affinity Edge (${interactionEdgeWeight})`,
                    'SHILL_BID_PATTERN',
                    auctionId
                );

                // In a full implementation, we would emit a Redis event here to update the WebSocket state,
                // instructing the socket server to "shadow ban" this user in real-time.
                return true;
            }

            return false;
        } catch (error) {
            console.error('[FraudService] Interaction Graph Detection error:', error);
            return false;
        }
    }
}
