import { Router } from 'express';
import { authenticateJWT, requireRole, requireEmailVerified } from '../middlewares/authMiddleware';
import {
    createAuction, getAuctions, searchAuctions, getCategories,
    getAuctionById, updateAuction, cancelAuction,
    getMyListings, getMyBids, setAutoBid, aiAutoLister, askProductAI, getLumeSuggestion, getMyAnalytics, getMyOrders
} from '../controllers/auctionController';

const router = Router();

// ── Public routes (no auth required) ──────────────────────────────
router.get('/search', searchAuctions);   // MUST be before /:id
router.get('/categories', getCategories);
router.get('/', getAuctions);
router.get('/:id', getAuctionById);

// ── All routes below require authentication ────────────────────────
router.use(authenticateJWT);

router.get('/my/listings', getMyListings);
router.get('/my/bids', getMyBids);
router.get('/my/analytics', getMyAnalytics);
router.get('/my/orders', getMyOrders);


// Seller/Buyer testing
router.post('/ai-auto-lister', requireRole(['SELLER', 'ADMIN', 'BUYER']), requireEmailVerified, aiAutoLister);
router.post('/', requireRole(['BUYER', 'SELLER', 'ADMIN']), requireEmailVerified, createAuction);
router.patch('/:id', requireRole(['BUYER', 'SELLER', 'ADMIN']), requireEmailVerified, updateAuction);
router.post('/:id/cancel', requireRole(['BUYER', 'SELLER', 'ADMIN']), requireEmailVerified, cancelAuction);

// Buyer routes
router.post('/:id/auto-bid', requireEmailVerified, setAutoBid);
router.post('/:id/ask-ai', askProductAI);
router.post('/:id/lume-suggestion', getLumeSuggestion);

export default router;
