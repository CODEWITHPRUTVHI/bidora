import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middlewares/authMiddleware';
import {
    getPlatformStats, getUsers, suspendUser, verifyUser,
    getAdminAuctions, forceRemoveAuction, getActionLogs,
    getPendingWithdrawals, approveWithdrawal, rejectWithdrawal
} from '../controllers/adminController';

const router = Router();

router.use(authenticateJWT, requireRole(['ADMIN']));

router.get('/stats', getPlatformStats);
router.get('/users', getUsers);
router.patch('/users/:id/suspend', suspendUser);
router.patch('/users/:id/verify', verifyUser);
router.get('/auctions', getAdminAuctions);
router.delete('/auctions/:id', forceRemoveAuction);
router.get('/withdrawals', getPendingWithdrawals);
router.post('/withdrawals/:id/approve', approveWithdrawal);
router.post('/withdrawals/:id/reject', rejectWithdrawal);
router.get('/logs', getActionLogs);

export default router;
