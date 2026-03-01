import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

// ─────────────────────────────────────────────
// POST /api/v1/ratings  (Leave a rating after COMPLETED auction)
// ─────────────────────────────────────────────
export const createRating = async (req: AuthRequest, res: Response) => {
    try {
        const { auctionId, toUserId, score, comment } = req.body;

        if (!auctionId || !toUserId || !score) {
            return res.status(400).json({ error: 'auctionId, toUserId, and score are required' });
        }
        if (score < 1 || score > 5) {
            return res.status(400).json({ error: 'Score must be between 1 and 5' });
        }
        if (req.user!.id === toUserId) {
            return res.status(400).json({ error: 'You cannot rate yourself' });
        }

        // Gate: Auction must be COMPLETED before allowing ratings
        const auction = await prisma.auction.findUnique({
            where: { id: auctionId },
            select: { status: true, sellerId: true }
        });
        if (!auction) return res.status(404).json({ error: 'Auction not found' });
        if (auction.status !== 'COMPLETED') {
            return res.status(400).json({ error: 'Ratings can only be submitted after the auction is completed' });
        }

        // Verify participants: One must be seller, other must be winning buyer
        const isSeller = auction.sellerId === req.user!.id;
        const winningBid = await prisma.bid.findFirst({
            where: { auctionId, isWinning: true }
        });

        if (!winningBid) {
            return res.status(400).json({ error: 'No winning bidder found for this auction' });
        }

        const isWinningBuyer = winningBid.bidderId === req.user!.id;

        if (!isSeller && !isWinningBuyer) {
            return res.status(403).json({ error: 'Only the seller or the winning buyer can leave a rating' });
        }

        // Ensure they are rating the OTHER party
        const targetIsCorrect = isSeller
            ? toUserId === winningBid.bidderId
            : toUserId === auction.sellerId;

        if (!targetIsCorrect) {
            return res.status(400).json({
                error: isSeller
                    ? 'Sellers can only rate the winning buyer'
                    : 'Buyers can only rate the seller'
            });
        }

        // Check for duplicate rating
        const existingRating = await prisma.rating.findFirst({
            where: { fromUserId: req.user!.id, auctionId }
        });
        if (existingRating) {
            return res.status(409).json({ error: 'You have already submitted a rating for this auction' });
        }

        const result = await prisma.$transaction(async (tx) => {
            // Create rating
            const rating = await tx.rating.create({
                data: {
                    fromUserId: req.user!.id,
                    toUserId,
                    auctionId,
                    score,
                    comment: comment || null
                }
            });

            // Recalculate trust score (avg of all received ratings, capped 1.0–5.0)
            const aggregate = await tx.rating.aggregate({
                where: { toUserId },
                _avg: { score: true },
                _count: { score: true }
            });

            const newTrustScore = aggregate._avg.score
                ? Math.max(1.0, Math.min(5.0, aggregate._avg.score))
                : 5.0;

            await tx.user.update({
                where: { id: toUserId },
                data: { trustScore: newTrustScore }
            });

            return { rating, newTrustScore };
        });

        return res.status(201).json({
            rating: result.rating,
            newTrustScore: result.newTrustScore,
            message: 'Rating submitted. Trust score updated.'
        });
    } catch (error) {
        console.error('[Ratings] Create error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// GET /api/v1/ratings/user/:userId  (Public profile ratings)
// ─────────────────────────────────────────────
export const getUserRatings = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;

        const [ratings, user] = await Promise.all([
            prisma.rating.findMany({
                where: { toUserId: userId },
                orderBy: { createdAt: 'desc' },
                take: 50,
                include: {
                    fromUser: { select: { id: true, fullName: true, avatarUrl: true } },
                    auction: { select: { id: true, title: true } }
                }
            }),
            prisma.user.findUnique({
                where: { id: userId },
                select: { trustScore: true, verifiedStatus: true, fullName: true }
            })
        ]);

        if (!user) return res.status(404).json({ error: 'User not found' });

        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>;
        ratings.forEach(r => { distribution[r.score] = (distribution[r.score] || 0) + 1; });

        return res.status(200).json({
            user,
            ratings,
            stats: {
                total: ratings.length,
                distribution,
                trustScore: Number(user.trustScore)
            }
        });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// GET /api/v1/ratings/auction/:auctionId  (Ratings for specific auction)
// ─────────────────────────────────────────────
export const getAuctionRatings = async (req: AuthRequest, res: Response) => {
    try {
        const ratings = await prisma.rating.findMany({
            where: { auctionId: req.params.auctionId },
            include: {
                fromUser: { select: { id: true, fullName: true } }
            }
        });
        return res.status(200).json({ ratings });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};
