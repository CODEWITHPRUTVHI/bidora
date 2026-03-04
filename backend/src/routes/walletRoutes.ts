import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { getWallet, getTransactions, deposit, withdraw, payForAuction } from '../controllers/walletController';

const router = Router();

// All wallet routes require authentication
router.use(authenticateJWT);

router.get('/', getWallet);
router.get('/transactions', getTransactions);
router.post('/deposit', deposit);
router.post('/withdraw', withdraw);
router.post('/pay-auction', payForAuction);

export default router;
