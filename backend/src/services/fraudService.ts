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
    static async flagUser(userId: string, reason: string): Promise<void> {
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
                eventType: 'RAPID_BIDDING',  // Default; callers should pass specific type
                metadata: { reason }
            }
        });

        console.warn(`[FraudService] User ${userId} flagged (${updated.suspiciousFlags} flags). Reason: ${reason}`);
    }
}
