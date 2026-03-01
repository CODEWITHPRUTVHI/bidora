import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { qs, qn } from '../utils/queryHelpers';
import { AuctionService } from '../services/auctionService';
import { io } from '../services/websocketService';
import { GoogleGenAI } from '@google/genai';

// Gemini moved into function scope to prevent global boot crashes


// ─────────────────────────────────────────────
// POST /api/v1/auctions
// ─────────────────────────────────────────────
export const createAuction = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, categoryId, startingPrice, reservePrice,
            bidIncrement, startTime, endTime, shippingCost, imageUrls } = req.body;

        if (!title || !description || !categoryId || !startingPrice || !startTime || !endTime) {
            return res.status(400).json({ error: 'Missing required auction fields' });
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
                startTime: start,
                endTime: end,
                shippingCost: shippingCost ? Number(shippingCost) : 0,
                imageUrls: imageUrls || [],
                status: status as any,
                commissionRate: Number(process.env.PLATFORM_COMMISSION_PERCENTAGE) || 7
            } as any
        });

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
                bids: { orderBy: { amount: 'desc' }, take: 20, include: { bidder: { select: { id: true, fullName: true } } } },
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

        const { title, description, reservePrice, startTime, endTime, shippingCost, imageUrls } = req.body;

        const updated = await prisma.auction.update({
            where: { id: req.params.id },
            data: {
                title: title || (auction as any).title,
                description: description || (auction as any).description,
                reservePrice: reservePrice !== undefined ? Number(reservePrice) : (auction as any).reservePrice,
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
// POST /api/v1/auctions/ai-auto-lister
// ─────────────────────────────────────────────
export const aiAutoLister = async (req: AuthRequest, res: Response) => {
    try {
        const { prompt, imageUrls } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'AI features are not configured on this server.' });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const systemInstruction = `
        You are an elite e-commerce copywriter and auction expert for Bidora.
        The user wants to list an item (text prompt provided, and possibly images).
        Generate a JSON response for their auction listing based on both inputs:
        {
          "title": "SEO-optimized title (max 80 chars)",
          "description": "Persuasive description covering condition, features, formatted with newlines.",
          "startingPrice": estimated starting bid in INR (number),
          "buyItNowPrice": instant purchase price in INR (number),
          "categoryId": integer ID (1: Electronics, 2: Fashion, 3: Art & Collectibles, 4: Fine Watches, 5: Cars, 6: Others)
        }
        Return ONLY valid JSON.
        `;

        // Prepare content parts (text prompt + images if any)
        const contents: any[] = [{ text: prompt }];

        if (imageUrls && Array.isArray(imageUrls)) {
            for (const url of imageUrls.slice(0, 3)) { // Limit to 3 images for AI analysis
                try {
                    const resp = await fetch(url);
                    if (!resp.ok) continue;
                    const buffer = await resp.arrayBuffer();
                    contents.push({
                        inlineData: {
                            mimeType: resp.headers.get('content-type') || 'image/jpeg',
                            data: Buffer.from(buffer).toString('base64')
                        }
                    });
                } catch (err) {
                    console.warn(`[AI] Failed to fetch image for analysis: ${url}`, err);
                }
            }
        }

        const result = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
            }
        });

        const textResponse = result.text || '{}';
        const parsedDraft = JSON.parse(textResponse);

        return res.status(200).json({ draft: parsedDraft });
    } catch (error: any) {
        console.error('[Auction] AI Auto-Lister error:', error);
        return res.status(500).json({ error: 'Failed to generate listing with AI. Please try again.' });
    }
};

// ─────────────────────────────────────────────
// POST /api/v1/auctions/:id/ask-ai
// ─────────────────────────────────────────────
export const askProductAI = async (req: AuthRequest, res: Response) => {
    try {
        const { question, history } = req.body;
        const { id } = req.params;

        if (!question) return res.status(400).json({ error: 'Question is required' });

        const auction = await prisma.auction.findUnique({
            where: { id },
            select: { title: true, description: true, startingPrice: true, buyItNowPrice: true, category: { select: { name: true } } }
        }) as any;

        if (!auction) return res.status(404).json({ error: 'Auction not found' });

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'AI features are not configured on this server.' });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        // @ts-ignore - Prisma type out of sync
        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

        const systemPrompt = `
        You are "Bidora AI Assistant", a helpful shopping assistant.
        The user is looking at this auction:
        TITLE: ${auction.title}
        CATEGORY: ${auction.category?.name || 'General'}
        PRICING: Starting at ₹${Number(auction.startingPrice).toLocaleString()}
        DESCRIPTION: 
        ${auction.description}

        YOUR TASK: Answer the user's question professionally, concisely, and honestly based ONLY on the provided listing.
        - If the answer IS in the description, highlight it.
        - If the answer IS NOT in the description, say: "That information isn't in the description. You should ask the seller directly using the messages feature."
        - Be friendly but professional. 
        - Max 3 short sentences.
        `;

        // Format history for Gemini chat
        const geminiHistory = (history || []).map((msg: any) => ({
            role: msg.type === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        const chat = model.startChat({
            history: geminiHistory,
            generationConfig: {
                maxOutputTokens: 200,
            }
        });

        const result = await chat.sendMessage([systemPrompt, question]);
        const response = result.response;
        const answer = response.text();

        return res.status(200).json({ answer });
    } catch (error: any) {
        console.error('[Auction] Ask AI error:', error);
        return res.status(500).json({ error: 'Failed to get answer from AI. Please try again later.' });
    }
};

// ─────────────────────────────────────────────
// GET /api/v1/auctions/my/analytics
// ─────────────────────────────────────────────
export const getMyAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        // 1. Total Sales (Released Escrows)
        const totalSales = await prisma.escrowPayment.aggregate({
            where: { sellerId: userId, status: 'RELEASED' },
            _sum: { amount: true }
        });

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
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentSalesArr = await prisma.auction.findMany({
            where: { sellerId: userId, status: { in: ['PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED'] as any }, createdAt: { gte: weekAgo } }
        });

        return res.status(200).json({
            totalSales: Number(totalSales._sum.amount) || 0,
            activeBidsReceiving: activeBidsCount,
            revenuePotential: parseFloat(profitPotential.toFixed(2)),
            recentSales: recentSalesArr.length
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
