import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import {
    getConversations,
    startConversation,
    getMessages,
    sendMessage,
    getUnreadCount
} from '../controllers/messagingController';

const router = Router();

// All messaging routes require authentication
router.use(authenticateJWT);

router.get('/conversations', getConversations);
router.post('/conversations', startConversation);
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/conversations/:conversationId/messages', sendMessage);
router.get('/unread-count', getUnreadCount);

export default router;
