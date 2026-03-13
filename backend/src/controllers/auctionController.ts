import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { qs, qn } from '../utils/queryHelpers';
import { AuctionService } from '../services/auctionService';
import { io } from '../services/websocketService';
import { scheduleAuctionEvents } from '../services/queueService';
import { CacheService } from '../services/cacheService';


// Gemini moved into function scope to prevent global boot crashes


// ───────────────────────────────────────────
// POST /api/v1/auctions
// ───────────────────────────────────────────

export const createAuction = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, categoryId, startingPrice, reservePrice,
            bidIncrement, startTime, endTime, shippingCost, imageUrls, buyItNowPrice, retailPrice } = req.body;

        if (!title || !description || !categoryId || !startingPrice || !startTime || !endTime) {
            return res.status(400).json({ error: 'Missing required auction fields' });
        }

        // 🛡️ LAUNCH READINESS: Enforce Seller Verification
        const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
        if (!user || user.verifiedStatus === 'BASIC') {
            return res.status(403).json({ 
                error: 'Account verification required to list auctions.',
                code: 'VERIFICATION_REQUIRED'
            });
        }


        const start = new Date(startTime);
        const end = new Date(endTime);
        const now = new Date();

        if (start >= end) return res.status(400).json({ error: 'End time must be after start time' });
        if (end <= now) return res.status(400).json({ error: 'End time must be in the future' });

        const status = start > now ? 'SCHEDULED' : 'LIVE';

        const auction = await prisma.auction.create({
            data: {
                sellerId: req.user!.id,
                title,
                description,
                categoryId: Number(categoryId),
                startingPrice: Number(startingPrice),
                reservePrice: reservePrice ? Number(reservePrice) : null,
                bidIncrement: bidIncrement ? Number(bidIncrement) : 1,
                buyItNowPrice: buyItNowPrice ? Number(buyItNowPrice) : null,
                retailPrice: retailPrice ? Number(retailPrice) : null,
                startTime: start,
                endTime: end,
                shippingCost: shippingCost ? Number(shippingCost) : 0,
                imageUrls: imageUrls || [],
                status: status as any,
                commissionRate: Number(process.env.PLATFORM_COMMISSION_PERCENTAGE) || 7
            } as any
        });

        // ── NEW: PRECISION SCHEDULING ───────────────────────
        await scheduleAuctionEvents(auction.id, start, end);
        // ──────────────────────────────────────────────────

        return res.status(201).json({ auction });
    } catch (error) {
        console.error('[Auction] Create error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};


// ─────────────────────────────────────────────
// GET /api/v1/auctions
// ─────────────────────────────────────────────
export const getAuctions = async (req: AuthRequest, res: Response) => {
    try {
        const status = qs(req.query.status);
        const categoryId = qs(req.query.categoryId);
        const page = qn(req.query.page, 1);
        const limit = qn(req.query.limit, 20);
        const sortBy = qs(req.query.sortBy, 'endTime');
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status) where.status = status;
        if (categoryId) where.categoryId = Number(categoryId);

        const [auctions, total] = await Promise.all([
            prisma.auction.findMany({
                where, skip, take: limit,
                orderBy: { [sortBy]: 'asc' },
                include: {
                    seller: { select: { id: true, fullName: true, trustScore: true, verifiedStatus: true } },
                    category: { select: { id: true, name: true, slug: true } },
                    _count: { select: { bids: true } }
                }
            }),
            prisma.auction.count({ where })
        ]);

        return res.status(200).json({
            auctions,
            pagination: { total, page, limit, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('[Auction] List error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// GET /api/v1/auctions/search  (Full-text + filters)
// ─────────────────────────────────────────────
export const searchAuctions = async (req: AuthRequest, res: Response) => {
    try {
        const q = qs(req.query.q);
        const status = qs(req.query.status, 'LIVE');
        const categoryId = qs(req.query.categoryId);
        const minPrice = qn(req.query.minPrice, 0);
        const maxPrice = qn(req.query.maxPrice, 0);
        const sortBy = qs(req.query.sortBy, 'endTime');
        const order = qs(req.query.order, 'asc');
        const page = qn(req.query.page, 1);
        const limit = qn(req.query.limit, 20);
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status) where.status = status;
        if (categoryId) where.categoryId = Number(categoryId);
        if (q) {
            where.OR = [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } }
            ];
        }
        if (minPrice > 0) where.currentHighestBid = { ...where.currentHighestBid, gte: minPrice };
        if (maxPrice > 0) where.currentHighestBid = { ...where.currentHighestBid, lte: maxPrice };

        const validSort = ['endTime', 'currentHighestBid', 'createdAt', 'bidCount'];
        const sortField = validSort.includes(sortBy) ? sortBy : 'endTime';
        const sortOrder = order === 'desc' ? 'desc' : 'asc';

        const [auctions, total] = await Promise.all([
            prisma.auction.findMany({
                where, skip, take: limit,
                orderBy: { [sortField]: sortOrder },
                include: {
                    seller: { select: { id: true, fullName: true, trustScore: true, verifiedStatus: true } },
                    category: { select: { id: true, name: true, slug: true } },
                    _count: { select: { bids: true } }
                }
            }),
            prisma.auction.count({ where })
        ]);

        return res.status(200).json({
            auctions,
            query: { q, status, categoryId, sortBy: sortField, order: sortOrder, page, limit },
            pagination: { total, page, limit, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('[Auction] Search error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// GET /api/v1/auctions/categories
// ─────────────────────────────────────────────
export const getCategories = async (req: AuthRequest, res: Response) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' },
            include: { _count: { select: { auctions: true } } }
        });
        return res.status(200).json({ categories });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// GET /api/v1/auctions/:id
// ─────────────────────────────────────────────
export const getAuctionById = async (req: AuthRequest, res: Response) => {
    try {
        const auction = await prisma.auction.findUnique({
            where: { id: req.params.id },
            include: {
                seller: { select: { id: true, fullName: true, trustScore: true, verifiedStatus: true, avatarUrl: true } },
                category: true,
                bids: { orderBy: { amount: 'desc' }, take: 20, include: { bidder: { select: { id: true, fullName: true, email: true, phone: true } } } },
                shippingDetail: { include: { buyerAddress: true } },
                _count: { select: { bids: true } }
            }
        });

        if (!auction) return res.status(404).json({ error: 'Auction not found' });

        // Calculate unique bidders
        const uniqueBiddersCount = await prisma.bid.groupBy({
            by: ['bidderId'],
            where: { auctionId: req.params.id },
            _count: true
        }).then(res => res.length);

        // Calculate total bidded by THIS user in this auction
        let userTotalBids = 0;
        let isWatched = false;

        if (req.user) {
            const [userBids, watchlistItem] = await Promise.all([
                prisma.bid.findMany({ where: { auctionId: req.params.id, bidderId: req.user.id } }),
                prisma.watchlist.findUnique({ where: { userId_auctionId: { userId: req.user.id, auctionId: req.params.id } } })
            ]);
            userTotalBids = userBids.reduce((sum: number, b: any) => sum + Number(b.amount), 0);
            isWatched = !!watchlistItem;
        }

        prisma.auction.update({ where: { id: req.params.id }, data: { viewCount: { increment: 1 } } }).catch(() => { });

        // ── NEW: CACHE ENHANCEMENT ────────────────────────
        const cachedState = await CacheService.getAuctionState(req.params.id);
        if (cachedState) {
            (auction as any).currentHighestBid = cachedState.currentHighestBid;
            (auction as any).endTime = cachedState.endTime;
            (auction as any).bidCount = cachedState.bidCount;
        }
        // ──────────────────────────────────────────────────

        // ── NEW: INJECT BUYER OBJECT FOR FRONTEND ORDERS PAGE ──────
        if (['PAYMENT_PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(auction.status)) {
            if (auction.bids && auction.bids.length > 0) {
                (auction as any).buyer = auction.bids[0].bidder;
            }
        }
        // ──────────────────────────────────────────────────────────

        return res.status(200).json({ auction, userTotalBids, isWatched, uniqueBiddersCount });
    } catch (error) {
        console.error('[Auction] Get-by-id error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// PATCH /api/v1/auctions/:id
// ─────────────────────────────────────────────
export const updateAuction = async (req: AuthRequest, res: Response) => {
    try {
        const auction = await prisma.auction.findUnique({ where: { id: req.params.id } });
        if (!auction) return res.status(404).json({ error: 'Auction not found' });
        if (auction.sellerId !== req.user!.id) return res.status(403).json({ error: 'Forbidden' });
        if (!['DRAFT', 'SCHEDULED'].includes(auction.status)) {
            return res.status(400).json({ error: 'Cannot edit an auction that is live or ended' });
        }

        const { title, description, reservePrice, startTime, endTime, shippingCost, imageUrls, buyItNowPrice, retailPrice } = req.body;

        const updated = await prisma.auction.update({
            where: { id: req.params.id },
            data: {
                title: title || (auction as any).title,
                description: description || (auction as any).description,
                reservePrice: reservePrice !== undefined ? Number(reservePrice) : (auction as any).reservePrice,
                buyItNowPrice: buyItNowPrice !== undefined ? Number(buyItNowPrice) : (auction as any).buyItNowPrice,
                retailPrice: retailPrice !== undefined ? Number(retailPrice) : (auction as any).retailPrice,
                startTime: startTime ? new Date(startTime) : (auction as any).startTime,
                endTime: endTime ? new Date(endTime) : (auction as any).endTime,
                shippingCost: shippingCost !== undefined ? Number(shippingCost) : (auction as any).shippingCost,
                imageUrls: imageUrls || (auction as any).imageUrls
            } as any
        });

        return res.status(200).json({ auction: updated });
    } catch (error) {
        console.error('[Auction] Update error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// POST /api/v1/auctions/:id/cancel
// ─────────────────────────────────────────────
export const cancelAuction = async (req: AuthRequest, res: Response) => {
    try {
        const auction = await prisma.auction.findUnique({ where: { id: req.params.id } });
        if (!auction) return res.status(404).json({ error: 'Auction not found' });
        if (auction.sellerId !== req.user!.id && req.user!.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (['LIVE', 'PAYMENT_PENDING'].includes(auction.status)) {
            return res.status(400).json({ error: 'Cannot cancel a live or payment-pending auction' });
        }
        if (['COMPLETED', 'CANCELLED', 'ENDED'].includes(auction.status)) {
            return res.status(400).json({ error: 'Auction is already finalized' });
        }

        const updated = await prisma.auction.update({
            where: { id: req.params.id },
            data: { status: 'CANCELLED' }
        });

        return res.status(200).json({ auction: updated, message: 'Auction cancelled' });
    } catch (error) {
        console.error('[Auction] Cancel error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// GET /api/v1/auctions/my/listings
// ─────────────────────────────────────────────
export const getMyListings = async (req: AuthRequest, res: Response) => {
    try {
        const auctions = await prisma.auction.findMany({
            where: { sellerId: req.user!.id },
            orderBy: { createdAt: 'desc' },
            include: { category: true, _count: { select: { bids: true } } }
        });
        return res.status(200).json({ auctions });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// GET /api/v1/auctions/my/bids
// ─────────────────────────────────────────────
export const getMyBids = async (req: AuthRequest, res: Response) => {
    try {
        const bids = await prisma.bid.findMany({
            where: { bidderId: req.user!.id },
            orderBy: { createdAt: 'desc' },
            include: {
                auction: {
                    select: {
                        id: true, title: true, status: true, currentHighestBid: true, endTime: true, imageUrls: true,
                        seller: { select: { id: true, fullName: true } }
                    }
                }
            }
        });
        return res.status(200).json({ bids });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// POST /api/v1/auctions/:id/auto-bid
// ─────────────────────────────────────────────
export const setAutoBid = async (req: AuthRequest, res: Response) => {
    try {
        const { maxAmount } = req.body;
        const auctionId = req.params.id;

        if (!maxAmount || Number(maxAmount) <= 0) {
            return res.status(400).json({ error: 'maxAmount must be a positive number' });
        }

        const auction = await prisma.auction.findUnique({ where: { id: auctionId } });
        if (!auction) return res.status(404).json({ error: 'Auction not found' });
        if (auction.status !== 'LIVE') return res.status(400).json({ error: 'Auction is not live' });
        if (auction.sellerId === req.user!.id) return res.status(400).json({ error: 'Sellers cannot bid on own auctions' });

        const currentBid = Number(auction.currentHighestBid);
        const minAllowed = currentBid > 0 ? currentBid : Number(auction.startingPrice);

        if (Number(maxAmount) <= minAllowed) {
            return res.status(400).json({ error: `Max amount must exceed the minimum required (₹${minAllowed})` });
        }

        const autoBid = await prisma.autoBid.upsert({
            where: { auctionId_bidderId: { auctionId, bidderId: req.user!.id } },
            create: { auctionId, bidderId: req.user!.id, maxAmount: Number(maxAmount), isActive: true },
            update: { maxAmount: Number(maxAmount), isActive: true }
        });

        return res.status(200).json({ autoBid, message: 'Auto-bid activated' });
    } catch (error) {
        console.error('[Auction] Auto-bid error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};


// ─────────────────────────────────────────────
// GET /api/v1/auctions/my/analytics
// ─────────────────────────────────────────────
export const getMyAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        // 1. Total Sales (Released Escrows)
        const totalSalesAggr = await prisma.escrowPayment.aggregate({
            where: { sellerId: userId, status: 'RELEASED' },
            _sum: { amount: true }
        });
        const totalSales = Number(totalSalesAggr._sum.amount) || 0;

        // 2. Active Bids Receiving (Count of bids on their LIVE auctions)
        const activeBidsCount = await prisma.bid.count({
            where: {
                auction: { sellerId: userId, status: 'LIVE' }
            }
        });

        // 3. Profit Potential (Sum of current highest bids on LIVE auctions - platform fee)
        const liveAuctions = await prisma.auction.findMany({
            where: { sellerId: userId, status: 'LIVE' },
            select: { currentHighestBid: true, commissionRate: true }
        });

        let profitPotential = 0;
        liveAuctions.forEach(a => {
            const bid = Number(a.currentHighestBid || 0);
            const fee = bid * (Number(a.commissionRate) / 100);
            profitPotential += (bid - fee);
        });

        // 4. Sales Velocity (Items sold in last 7 days)
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const recentSalesArr = await prisma.auction.findMany({
            where: { sellerId: userId, status: { in: ['PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED'] as any }, createdAt: { gte: weekAgo } }
        });

        // 5. Build 7-day performance data (bids received per day)
        const bidsLast7Days = await prisma.bid.findMany({
            where: {
                auction: { sellerId: userId },
                createdAt: { gte: weekAgo }
            },
            select: { createdAt: true }
        });

        const performanceData = Array(7).fill(0);
        bidsLast7Days.forEach(bid => {
            const diffTime = Math.abs(today.getTime() - bid.createdAt.getTime());
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays < 7) {
                // index 6 is today, index 0 is 6 days ago
                performanceData[6 - diffDays]++;
            }
        });

        // Normalize performance data to percentages for UI (max 100)
        const maxBids = Math.max(...performanceData, 1);
        const performance = performanceData.map(val => Math.round((val / maxBids) * 100));

        // 6. Calculate Seller Level based on total sales
        let level = 1;
        let nextTier = 10000;
        let progress = 0;

        if (totalSales >= 500000) { level = 4; nextTier = 1000000; }
        else if (totalSales >= 100000) { level = 3; nextTier = 500000; }
        else if (totalSales >= 10000) { level = 2; nextTier = 100000; }
        else { nextTier = 10000; }

        progress = Math.min(Math.round((totalSales / nextTier) * 100), 100);

        return res.status(200).json({
            totalSales,
            activeBidsReceiving: activeBidsCount,
            revenuePotential: parseFloat(profitPotential.toFixed(2)),
            recentSales: recentSalesArr.length,
            performance, // 7 elements array
            sellerLevel: { level, nextTier, progress }
        });
    } catch (error) {
        console.error('[Analytics] Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// GET /api/v1/auctions/my/orders
// ─────────────────────────────────────────────
export const getMyOrders = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        // Won auctions (Buyer perspective)
        const wonAuctions = await prisma.auction.findMany({
            where: {
                bids: {
                    some: {
                        bidderId: userId,
                        isWinning: true
                    }
                },
                status: {
                    in: ['PAYMENT_PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'DISPUTED']
                }
            },
            orderBy: { updatedAt: 'desc' },
            include: {
                seller: { select: { id: true, fullName: true, avatarUrl: true, trustScore: true } },
                category: { select: { name: true } },
                shippingDetail: true,
                escrowPayment: true,
                _count: { select: { bids: true } }
            }
        });

        // Sold auctions (Seller perspective)
        const soldAuctions = await prisma.auction.findMany({
            where: {
                sellerId: userId,
                status: {
                    in: ['PAYMENT_PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'DISPUTED']
                }
            },
            orderBy: { updatedAt: 'desc' },
            include: {
                bids: {
                    where: { isWinning: true },
                    include: { bidder: { select: { id: true, fullName: true, avatarUrl: true, trustScore: true } } }
                },
                category: { select: { name: true } },
                shippingDetail: true,
                escrowPayment: true,
                _count: { select: { bids: true } }
            }
        });

        return res.status(200).json({ wonAuctions, soldAuctions });
    } catch (error) {
        console.error('Error in getMyOrders:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
