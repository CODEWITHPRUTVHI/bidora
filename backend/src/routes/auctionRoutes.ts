import { Router } from 'express';
import { authenticateJWT, optionalAuth, requireRole, requireEmailVerified } from '../middlewares/authMiddleware';
import {
    createAuction, getAuctions, searchAuctions, getCategories,
    getAuctionById, updateAuction, cancelAuction,
    getMyListings, getMyBids, setAutoBid, getMyAnalytics, getMyOrders
} from '../controllers/auctionController';

const router = Router();

// ── Public routes (no auth required) ──────────────────────────────
router.get('/search', searchAuctions);
router.get('/categories', getCategories);
router.get('/', getAuctions);

// ── Authenticated routes FIRST to avoid /my/* being caught by /:id ─
router.use('/my', authenticateJWT);
router.get('/my/listings', getMyListings);
router.get('/my/bids', getMyBids);
router.get('/my/analytics', getMyAnalytics);
router.get('/my/orders', getMyOrders);

// ── Single auction GET — optionally auth so guests & users both work
router.get('/:id', optionalAuth, getAuctionById);

// ── Authenticated write routes ─────────────────────────────────────
router.use(authenticateJWT);

router.post('/', requireRole(['BUYER', 'SELLER', 'ADMIN']), createAuction);
router.patch('/:id', requireRole(['BUYER', 'SELLER', 'ADMIN']), updateAuction);
router.post('/:id/cancel', requireRole(['BUYER', 'SELLER', 'ADMIN']), cancelAuction);
router.post('/:id/auto-bid', setAutoBid);

export default router;
