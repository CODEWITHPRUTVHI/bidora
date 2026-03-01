import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middlewares/authMiddleware';
import { createRating, getUserRatings, getAuctionRatings } from '../controllers/ratingController';

const router = Router();

router.get('/user/:userId', getUserRatings);
router.get('/auction/:auctionId', getAuctionRatings);
router.post('/', authenticateJWT, createRating);

export default router;
