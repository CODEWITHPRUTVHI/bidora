import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middlewares/authMiddleware';
import { openDispute, getMyDisputes, getAllDisputes, resolveDispute } from '../controllers/disputeController';

const router = Router();

router.use(authenticateJWT);

router.post('/', openDispute);
router.get('/my', getMyDisputes);
router.get('/admin', requireRole(['ADMIN']), getAllDisputes);
router.patch('/:id/resolve', requireRole(['ADMIN']), resolveDispute);

export default router;
