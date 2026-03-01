import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

// ─────────────────────────────────────────────
// POST /api/v1/watchlist/toggle
// ─────────────────────────────────────────────
export const toggleWatch = async (req: AuthRequest, res: Response) => {
    try {
        const { auctionId } = req.body;
        const userId = req.user!.id;

        if (!auctionId) {
            return res.status(400).json({ error: 'auctionId is required' });
        }

        // Check if auction exists
        const auction = await prisma.auction.findUnique({
            where: { id: auctionId },
            select: { id: true, title: true }
        });
        if (!auction) return res.status(404).json({ error: 'Auction not found' });

        // Check if already in watchlist
        const existing = await prisma.watchlist.findUnique({
            where: {
                userId_auctionId: { userId, auctionId }
            }
        });

        if (existing) {
            // Remove from watchlist
            await prisma.watchlist.delete({
                where: { id: existing.id }
            });
            return res.status(200).json({
                isWatched: false,
                message: `Removed "${auction.title}" from your watchlist.`
            });
        } else {
            // Add to watchlist
            await prisma.watchlist.create({
                data: { userId, auctionId }
            });
            return res.status(201).json({
                isWatched: true,
                message: `Added "${auction.title}" to your watchlist.`
            });
        }
    } catch (error) {
        console.error('[Watchlist] Toggle error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// GET /api/v1/watchlist
// ─────────────────────────────────────────────
export const getWatchlist = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const watchlistItems = await prisma.watchlist.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                auction: {
                    select: {
                        id: true,
                        title: true,
                        currentHighestBid: true,
                        endTime: true,
                        imageUrls: true,
                        status: true,
                        bidCount: true,
                        seller: {
                            select: {
                                fullName: true,
                                verifiedStatus: true
                            }
                        }
                    }
                }
            }
        });

        return res.status(200).json({ watchlist: watchlistItems });
    } catch (error) {
        console.error('[Watchlist] Get error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
