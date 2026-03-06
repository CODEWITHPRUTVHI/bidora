import { redisClient } from '../utils/redis';

export class CacheService {
    private static TTL = 3600; // 1 hour for active auctions

    /**
     * Cache basic auction state for ultra-fast reads.
     */
    static async setAuctionState(auctionId: string, data: { currentHighestBid: number; endTime: string; bidCount: number }): Promise<void> {
        const key = `auction:${auctionId}:state`;
        await redisClient.set(key, JSON.stringify(data), {
            EX: this.TTL
        });
    }

    /**
     * Get cached auction state.
     */
    static async getAuctionState(auctionId: string): Promise<any | null> {
        const key = `auction:${auctionId}:state`;
        const cached = await redisClient.get(key);
        return cached ? JSON.parse(cached) : null;
    }

    /**
     * Invalidate auction cache.
     */
    static async invalidateAuction(auctionId: string): Promise<void> {
        await redisClient.del(`auction:${auctionId}:state`);
    }
}
