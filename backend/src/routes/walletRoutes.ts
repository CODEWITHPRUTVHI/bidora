import { Router } from 'express';
import { authenticateJWT, requireEmailVerified } from '../middlewares/authMiddleware';
import { getWallet, getTransactions, deposit, withdraw, payForAuction } from '../controllers/walletController';

const router = Router();

// All wallet routes require authentication
router.use(authenticateJWT);

router.get('/', getWallet);
router.get('/transactions', getTransactions);
router.post('/deposit', requireEmailVerified, deposit);
router.post('/withdraw', requireEmailVerified, withdraw);
router.post('/pay-auction', requireEmailVerified, payForAuction);

export default router;
