import { Router } from 'express';
import { authenticateJWT as authenticate, optionalAuth } from '../middlewares/authMiddleware';
import * as SocialController from '../controllers/socialController';

const router = Router();

// Hype feed (Public or Auth)
router.get('/feed', SocialController.getHypeFeed);

// Public user profile (Optional Auth allows us to know if the requesting user follows them)
router.get('/profile/:id', optionalAuth, SocialController.getUserProfile);

// Follow actions
router.post('/follow/:id', authenticate, SocialController.followUser);
router.delete('/unfollow/:id', authenticate, SocialController.unfollowUser);
router.get('/status/:id', authenticate, SocialController.checkFollowingStatus);

export default router;
