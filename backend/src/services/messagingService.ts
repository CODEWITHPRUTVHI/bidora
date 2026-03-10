import prisma from '../utils/prisma';
import { io } from './websocketService';

export class MessagingService {
    /**
     * Get or create a conversation between two users.
     * Always stores user1Id as the smaller string (lexicographically) to keep uniqueness.
     */
    static async getOrCreateConversation(userAId: string, userBId: string, auctionId?: string) {
        const [user1Id, user2Id] = [userAId, userBId].sort();

        const existing = await prisma.conversation.findUnique({
            where: { user1Id_user2Id: { user1Id, user2Id } },
            include: {
                user1: { select: { id: true, fullName: true, avatarUrl: true, verifiedStatus: true } },
                user2: { select: { id: true, fullName: true, avatarUrl: true, verifiedStatus: true } },
                messages: {
                    orderBy: { createdAt: 'asc' },
                    take: 50,
                    include: { sender: { select: { id: true, fullName: true, avatarUrl: true } } }
                }
            }
        });

        if (existing) return existing;

        return prisma.conversation.create({
            data: { user1Id, user2Id, auctionId: auctionId ?? null },
            include: {
                user1: { select: { id: true, fullName: true, avatarUrl: true, verifiedStatus: true } },
                user2: { select: { id: true, fullName: true, avatarUrl: true, verifiedStatus: true } },
                messages: true
            }
        });
    }

    /**
     * Get all conversations for a user, with their last message.
     */
    static async getUserConversations(userId: string) {
        const conversations = await prisma.conversation.findMany({
            where: {
                OR: [{ user1Id: userId }, { user2Id: userId }]
            },
            include: {
                user1: { select: { id: true, fullName: true, avatarUrl: true, verifiedStatus: true } },
                user2: { select: { id: true, fullName: true, avatarUrl: true, verifiedStatus: true } },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        // Attach unread count per conversation
        return Promise.all(conversations.map(async (conv) => {
            const unreadCount = await prisma.message.count({
                where: {
                    conversationId: conv.id,
                    isRead: false,
                    senderId: { not: userId } // only messages FROM the other person
                }
            });
            return { ...conv, unreadCount };
        }));
    }

    /**
     * Get messages for a conversation, marking them as read.
     */
    static async getMessages(conversationId: string, userId: string, before?: string) {
        // Mark all unread messages from the other person as read
        await prisma.message.updateMany({
            where: {
                conversationId,
                isRead: false,
                senderId: { not: userId }
            },
            data: { isRead: true }
        });

        return prisma.message.findMany({
            where: {
                conversationId,
                ...(before ? { createdAt: { lt: new Date(before) } } : {})
            },
            orderBy: { createdAt: 'asc' },
            take: 60,
            include: { sender: { select: { id: true, fullName: true, avatarUrl: true } } }
        });
    }

    /**
     * Send a message and emit a real-time event.
     */
    static async sendMessage(conversationId: string, senderId: string, body: string) {
        if (!body?.trim()) throw new Error('Message body cannot be empty');

        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            select: { user1Id: true, user2Id: true }
        });

        if (!conversation) throw new Error('Conversation not found');

        // Verify sender is part of this conversation
        const recipientId = conversation.user1Id === senderId
            ? conversation.user2Id
            : conversation.user1Id;

        if (![conversation.user1Id, conversation.user2Id].includes(senderId)) {
            throw new Error('Not a participant in this conversation');
        }

        // Create message and bump conversation updatedAt
        const [message] = await prisma.$transaction([
            prisma.message.create({
                data: { conversationId, senderId, body: body.trim() },
                include: { sender: { select: { id: true, fullName: true, avatarUrl: true } } }
            }),
            prisma.conversation.update({
                where: { id: conversationId },
                data: { updatedAt: new Date() }
            })
        ]);

        // Emit real-time to recipient's room
        io.to(`user:${recipientId}`).emit('new_message', {
            conversationId,
            message
        });

        // Create notification for recipient (fire-and-forget)
        prisma.notification.create({
            data: {
                userId: recipientId,
                type: 'NEW_MESSAGE',
                title: `💬 New message from ${message.sender.fullName || 'Someone'}`,
                body: body.trim().slice(0, 100),
                referenceId: conversationId
            }
        }).catch(() => {});

        return message;
    }

    /**
     * Get total unread message count for a user (for nav badge).
     */
    static async getUnreadCount(userId: string) {
        return prisma.message.count({
            where: {
                isRead: false,
                senderId: { not: userId },
                conversation: {
                    OR: [{ user1Id: userId }, { user2Id: userId }]
                }
            }
        });
    }
}
