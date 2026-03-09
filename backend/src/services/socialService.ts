import prisma from '../utils/prisma';
import { io } from './websocketService';

export class SocialService {
    /**
     * Follow a user and emit a real-time event
     */
    static async followUser(followerId: string, followingId: string) {
        if (followerId === followingId) throw new Error('You cannot follow yourself');

        const existing = await prisma.follow.findUnique({
            where: {
                followerId_followingId: { followerId, followingId }
            }
        });

        if (existing) throw new Error('Already following this user');

        const follow = await prisma.follow.create({
            data: { followerId, followingId },
            include: {
                follower: { select: { id: true, fullName: true, avatarUrl: true } },
                following: { select: { id: true, fullName: true, avatarUrl: true } }
            }
        });

        // ── REAL-TIME HYPE ──────────────────────────
        // Notify the person being followed
        io.to(`user:${followingId}`).emit('new_follower', {
            followerId: follow.follower.id,
            followerName: follow.follower.fullName,
            followerAvatar: follow.follower.avatarUrl
        });

        return follow;
    }

    /**
     * Unfollow a user
     */
    static async unfollowUser(followerId: string, followingId: string) {
        return prisma.follow.delete({
            where: {
                followerId_followingId: { followerId, followingId }
            }
        });
    }

    /**
     * Get Hype Feed - Real activities across the platform
     * Uses real data from Bids and Escrow releases.
     */
    static async getHypeFeed() {
        // 1. Get recent high-value bid activity
        const recentBids = await prisma.bid.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                bidder: { select: { id: true, fullName: true, avatarUrl: true, collectorBadge: true } },
                auction: { select: { id: true, title: true } }
            }
        });

        // 2. Get recent successful escrow releases (Real proofs of trade)
        const recentWins = await prisma.escrowPayment.findMany({
            where: { status: 'RELEASED' },
            take: 5,
            orderBy: { releasedAt: 'desc' },
            include: {
                seller: { select: { id: true, fullName: true, avatarUrl: true, collectorBadge: true } },
                auction: { select: { id: true, title: true } }
            }
        });

        // 3. Get recent follow activity (Social networking signals)
        const recentFollows = await prisma.follow.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                follower: { select: { id: true, fullName: true, avatarUrl: true, collectorBadge: true } },
                following: { select: { id: true, fullName: true, avatarUrl: true } }
            }
        });

        // 4. Format into a unified feed
        const feed = [
            ...recentBids.map(b => ({
                id: `bid-${b.id}`,
                type: 'BID',
                userId: (b as any).bidder.id,
                userName: (b as any).bidder.fullName,
                userAvatar: (b as any).bidder.avatarUrl,
                userBadge: (b as any).bidder.collectorBadge,
                action: 'placed a bid on',
                target: (b as any).auction.title,
                targetId: (b as any).auction.id,
                amount: b.amount,
                timestamp: b.createdAt
            })),
            ...recentWins.map(w => ({
                id: `win-${w.id}`,
                type: 'WIN',
                userId: (w as any).seller.id,
                userName: (w as any).seller.fullName,
                userAvatar: (w as any).seller.avatarUrl,
                userBadge: (w as any).seller.collectorBadge,
                action: 'successfully sold',
                target: (w as any).auction.title,
                targetId: (w as any).auction.id,
                amount: w.amount,
                timestamp: w.releasedAt
            })),
            ...recentFollows.map((f: any) => ({
                id: `follow-${f.id}`,
                type: 'FOLLOW',
                userId: (f as any).follower.id,
                userName: (f as any).follower.fullName,
                userAvatar: (f as any).follower.avatarUrl,
                userBadge: (f as any).follower.collectorBadge,
                action: 'started following',
                target: (f as any).following.fullName,
                targetId: f.followingId,
                amount: 0,
                timestamp: f.createdAt
            }))
        ].sort((a, b) => new Date(b.timestamp as any).getTime() - new Date(a.timestamp as any).getTime());

        return feed;
    }

    /**
     * Check if one user follows another
     */
    static async isFollowing(followerId: string, followingId: string) {
        const follow = await prisma.follow.findUnique({
            where: { followerId_followingId: { followerId, followingId } }
        });
        return !!follow;
    }

    /**
     * Broadcast a hype event globally
     */
    static async broadcastHype(event: any) {
        io.emit('hype_event', {
            ...event,
            timestamp: new Date()
        });
    }

    /**
     * Get Public User Profile
     */
    static async getUserProfile(userId: string, requestingUserId?: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                collectorBadge: true,
                verifiedStatus: true,
                trustScore: true,
                createdAt: true,
                _count: {
                    select: {
                        followers: true,
                        following: true,
                        auctionsAsSeller: { where: { status: 'LIVE' } },
                        escrowAsSeller: { where: { status: 'RELEASED' } },
                    }
                }
            }
        });

        if (!user) throw new Error('User not found');

        // Get their active listings
        const activeListings = await prisma.auction.findMany({
            where: { sellerId: userId, status: 'LIVE' },
            select: {
                id: true,
                title: true,
                currentHighestBid: true,
                imageUrls: true,
                endTime: true,
                _count: { select: { bids: true } }
            },
            take: 10,
            orderBy: { endTime: 'asc' }
        });

        // Get their recent sales
        const recentSales = await prisma.escrowPayment.findMany({
            where: { sellerId: userId, status: 'RELEASED' },
            select: {
                id: true,
                amount: true,
                releasedAt: true,
                auction: { select: { id: true, title: true, imageUrls: true } }
            },
            take: 5,
            orderBy: { releasedAt: 'desc' }
        });

        let isFollowing = false;
        if (requestingUserId && requestingUserId !== userId) {
            const follow = await prisma.follow.findUnique({
                where: { followerId_followingId: { followerId: requestingUserId, followingId: userId } }
            });
            isFollowing = !!follow;
        }

        return {
            ...user,
            activeListings,
            recentSales,
            isFollowing
        };
    }
}
