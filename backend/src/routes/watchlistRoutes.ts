import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { toggleWatch, getWatchlist } from '../controllers/watchlistController';

const router = Router();

router.get('/', authenticateJWT, getWatchlist);
router.post('/toggle', authenticateJWT, toggleWatch);

export default router;
