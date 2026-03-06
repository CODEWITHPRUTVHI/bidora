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
     * Analyzes an auction's bid history for shill bidding patterns using Google GenAI.
     * Looks for unrealistic timing, immediate retaliation by new accounts, etc.
     */
    static async analyzeForShillBidding(auctionId: string): Promise<boolean> {
        try {
            const auction = await prisma.auction.findUnique({
                where: { id: auctionId },
                include: {
                    seller: { select: { id: true, trustScore: true, suspiciousFlags: true } },
                    bids: {
                        orderBy: { createdAt: 'asc' },
                        include: { bidder: { select: { id: true, trustScore: true, suspiciousFlags: true } } }
                    }
                }
            });

            if (!auction || auction.bids.length < 4) return false; // Need sufficient data points

            // Only run if GEMINI_API_KEY is available
            if (!process.env.GEMINI_API_KEY) return false;

            const { GoogleGenAI } = require('@google/genai');
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

            const prompt = `
            Analyze the following auction bidding history for "Shill Bidding" (the seller using secondary accounts to artificially drive up the price).
            
            Context: Shill bidding often involves new accounts or accounts with low trust scores rapidly increasing the price, frequently alternating with genuine bidders, or placing bids immediately after a genuine bid without strategic reason.
            
            Auction ID: ${auction.id}
            Seller ID: ${auction.seller.id}
            Seller Trust Score: ${auction.seller.trustScore.toString()}/5
            Current Price: ₹${auction.currentHighestBid.toString()}
            
            Bids Chronological History:
            ${auction.bids.map(b => `[${b.createdAt.toISOString()}] Bidder ${b.bidder.id} (Trust: ${b.bidder.trustScore.toString()}) placed bid of ₹${b.amount.toString()}`).join('\n')}
            
            Respond STRICTLY in JSON format with the following schema:
            {
                "isShillBidding": boolean,
                "confidenceScore": number (0-100),
                "suspectBidderId": "string or null",
                "reasoning": "short explanation of the detected pattern"
            }
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                }
            });

            const resultText = response.text;
            if (!resultText) return false;

            const result = JSON.parse(resultText);

            if (result.isShillBidding && result.confidenceScore >= 85 && result.suspectBidderId) {
                console.log(`[GenAI Fraud Engine] Shill Bidding Detected! Confidence: ${result.confidenceScore}%`);
                await FraudService.flagUser(
                    result.suspectBidderId,
                    `AI Detection (Confidence ${result.confidenceScore}%): ${result.reasoning}`,
                    'SHILL_BID_PATTERN',
                    auctionId
                );
                return true;
            }

            return false;
        } catch (error) {
            console.error('[FraudService] GenAI Shill Detection error:', error);
            return false;
        }
    }
}
