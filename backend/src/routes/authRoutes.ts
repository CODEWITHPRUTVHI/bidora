import { Router } from 'express';
import { register, login, logout, refreshAccessToken, getMe, verifyMeAsSeller, verifyEmail } from '../controllers/authController';
import { googleLogin, phoneLogin } from '../controllers/oauthController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refreshAccessToken);
router.get('/me', authenticateJWT, getMe);
router.patch('/me/verify-seller', authenticateJWT, verifyMeAsSeller);

// OAuth routes
router.post('/google', googleLogin);
router.post('/phone', phoneLogin);

export default router;
