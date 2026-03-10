import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { MessagingService } from '../services/messagingService';

/**
 * GET /api/v1/messages/conversations
 * Returns all conversations for the authenticated user (with unread counts)
 */
export const getConversations = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const conversations = await MessagingService.getUserConversations(userId);
        return res.json({ conversations });
    } catch (err: any) {
        console.error('[Messaging] getConversations error:', err);
        return res.status(500).json({ error: 'Failed to load conversations' });
    }
};

/**
 * POST /api/v1/messages/conversations
 * Get or create a conversation with another user.
 * Body: { recipientId, auctionId? }
 */
export const startConversation = async (req: AuthRequest, res: Response) => {
    try {
        const senderId = req.user!.id;
        const { recipientId, auctionId } = req.body;

        if (!recipientId) return res.status(400).json({ error: 'recipientId is required' });
        if (recipientId === senderId) return res.status(400).json({ error: 'You cannot message yourself' });

        const conversation = await MessagingService.getOrCreateConversation(senderId, recipientId, auctionId);
        return res.json({ conversation });
    } catch (err: any) {
        console.error('[Messaging] startConversation error:', err);
        return res.status(500).json({ error: 'Failed to start conversation' });
    }
};

/**
 * GET /api/v1/messages/conversations/:conversationId/messages
 * Get messages for a specific conversation (marks them as read).
 */
export const getMessages = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { conversationId } = req.params;
        const { before } = req.query;

        const messages = await MessagingService.getMessages(conversationId, userId, before as string | undefined);
        return res.json({ messages });
    } catch (err: any) {
        console.error('[Messaging] getMessages error:', err);
        return res.status(500).json({ error: 'Failed to load messages' });
    }
};

/**
 * POST /api/v1/messages/conversations/:conversationId/messages
 * Send a new message in a conversation.
 * Body: { body }
 */
export const sendMessage = async (req: AuthRequest, res: Response) => {
    try {
        const senderId = req.user!.id;
        const { conversationId } = req.params;
        const { body } = req.body;

        if (!body?.trim()) return res.status(400).json({ error: 'Message body is required' });

        const message = await MessagingService.sendMessage(conversationId, senderId, body);
        return res.status(201).json({ message });
    } catch (err: any) {
        console.error('[Messaging] sendMessage error:', err);
        if (err.message === 'Not a participant in this conversation') {
            return res.status(403).json({ error: err.message });
        }
        return res.status(500).json({ error: 'Failed to send message' });
    }
};

/**
 * GET /api/v1/messages/unread-count
 * Returns total unread message count for the authenticated user.
 */
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const count = await MessagingService.getUnreadCount(userId);
        return res.json({ count });
    } catch (err: any) {
        console.error('[Messaging] getUnreadCount error:', err);
        return res.status(500).json({ error: 'Failed to get unread count' });
    }
};
