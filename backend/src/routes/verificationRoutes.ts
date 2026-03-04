import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middlewares/authMiddleware';
import {
    applyForVerification,
    getMyVerificationStatus,
    getPendingVerifications,
    reviewVerification
} from '../controllers/verificationController';

const router = Router();

// User routes (authenticated)
router.post('/apply', authenticateJWT, applyForVerification);
router.get('/my-status', authenticateJWT, getMyVerificationStatus);

// Admin routes
router.get('/admin/pending', authenticateJWT, requireRole(['ADMIN']), getPendingVerifications);
router.patch('/admin/:id/review', authenticateJWT, requireRole(['ADMIN']), reviewVerification);

export default router;
