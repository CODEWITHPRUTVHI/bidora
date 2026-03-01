import prisma from '../utils/prisma';
import { NotificationType } from '@prisma/client';
import { EmailService } from './emailService';

// We import io lazily to avoid circular dependency with websocketService
let _io: any = null;
export const setNotificationIO = (io: any) => { _io = io; };

interface CreateNotificationParams {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    referenceId?: string;
}

// ─────────────────────────────────────────────
// Helper: fetch user email + name for emailing
// ─────────────────────────────────────────────
async function getUserContact(userId: string): Promise<{ email: string; name: string } | null> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, fullName: true }
        });
        if (!user) return null;
        return { email: user.email, name: user.fullName || '' };
    } catch {
        return null;
    }
}

/**
 * Creates a persistent notification record, pushes it via WebSocket,
 * AND sends an email — all three channels in parallel (non-blocking).
 */
export class NotificationService {
    static async send(params: CreateNotificationParams): Promise<void> {
        try {
            const notification = await prisma.notification.create({
                data: {
                    userId: params.userId,
                    type: params.type,
                    title: params.title,
                    body: params.body,
                    referenceId: params.referenceId || null,
                    isRead: false
                }
            });

            // ── WebSocket push (fire-and-forget) ──────────────
            if (_io) {
                _io.to(`user:${params.userId}`).emit('notification', {
                    id: notification.id,
                    type: notification.type,
                    title: notification.title,
                    body: notification.body,
                    referenceId: notification.referenceId,
                    createdAt: notification.createdAt
                });
            }
        } catch (error) {
            console.error('[NotificationService] Failed to send notification:', error);
        }
    }

    // ─────────────────────────────────────────────
    // Factory methods — in-app + email together
    // ─────────────────────────────────────────────

    static async notifyBidPlaced(bidderId: string, auctionId: string, auctionTitle: string, amount: number) {
        await this.send({
            userId: bidderId,
            type: 'BID_PLACED',
            title: 'Bid Placed ✅',
            body: `Your bid of ₹${amount.toLocaleString()} on "${auctionTitle}" was accepted.`,
            referenceId: auctionId
        });
        // No email for bid placed — would be too noisy
    }

    static async notifyOutbid(previousBidderId: string, auctionId: string, auctionTitle: string, newAmount: number) {
        await this.send({
            userId: previousBidderId,
            type: 'OUTBID',
            title: "You've Been Outbid! 🔔",
            body: `Someone bid ₹${newAmount.toLocaleString()} on "${auctionTitle}". Bid again to stay in the lead!`,
            referenceId: auctionId
        });
        // Email — high-urgency
        const contact = await getUserContact(previousBidderId);
        if (contact) {
            EmailService.sendOutbid(contact.email, contact.name, auctionTitle, auctionId, newAmount).catch(() => { });
        }
    }

    static async notifyAuctionWon(winnerId: string, auctionId: string, auctionTitle: string, amount: number) {
        await this.send({
            userId: winnerId,
            type: 'AUCTION_WON',
            title: '🎉 You Won!',
            body: `Congratulations! You won "${auctionTitle}" for ₹${amount.toLocaleString()}. Please complete payment within 48 hours.`,
            referenceId: auctionId
        });
        const contact = await getUserContact(winnerId);
        if (contact) {
            EmailService.sendAuctionWon(contact.email, contact.name, auctionTitle, auctionId, amount).catch(() => { });
        }
    }

    static async notifyPaymentRequired(buyerId: string, auctionId: string, auctionTitle: string, amount: number) {
        await this.send({
            userId: buyerId,
            type: 'PAYMENT_REQUIRED',
            title: '💳 Payment Required',
            body: `Please pay ₹${amount.toLocaleString()} for "${auctionTitle}" within 48 hours to secure your item.`,
            referenceId: auctionId
        });
        const contact = await getUserContact(buyerId);
        if (contact) {
            EmailService.sendPaymentRequired(contact.email, contact.name, auctionTitle, auctionId, amount).catch(() => { });
        }
    }

    static async notifyPaymentReceived(sellerId: string, auctionId: string, auctionTitle: string, amount?: number) {
        await this.send({
            userId: sellerId,
            type: 'PAYMENT_RECEIVED',
            title: '💰 Payment Received',
            body: `The buyer has paid for "${auctionTitle}". Please ship the item and provide a tracking number.`,
            referenceId: auctionId
        });
        const contact = await getUserContact(sellerId);
        if (contact) {
            EmailService.sendPaymentReceived(contact.email, contact.name, auctionTitle, amount || 0).catch(() => { });
        }
    }

    static async notifyItemShipped(buyerId: string, auctionId: string, auctionTitle: string, courier: string, trackingNumber: string) {
        await this.send({
            userId: buyerId,
            type: 'ITEM_SHIPPED',
            title: '📦 Your Item is Shipped!',
            body: `"${auctionTitle}" has been shipped via ${courier}. Tracking: ${trackingNumber}`,
            referenceId: auctionId
        });
        const contact = await getUserContact(buyerId);
        if (contact) {
            EmailService.sendItemShipped(contact.email, contact.name, auctionTitle, auctionId, courier, trackingNumber).catch(() => { });
        }
    }

    static async notifyDisputeOpened(sellerId: string, auctionId: string, auctionTitle: string) {
        await this.send({
            userId: sellerId,
            type: 'DISPUTE_OPENED',
            title: '⚠️ Dispute Opened',
            body: `The buyer has opened a dispute for "${auctionTitle}". Escrow is temporarily frozen.`,
            referenceId: auctionId
        });
        const contact = await getUserContact(sellerId);
        if (contact) {
            EmailService.sendDisputeOpened(contact.email, contact.name, auctionTitle).catch(() => { });
        }
    }

    static async notifyDisputeResolved(userId: string, auctionId: string, decision: string) {
        await this.send({
            userId,
            type: 'DISPUTE_RESOLVED',
            title: '⚖️ Dispute Resolved',
            body: `Admin has resolved the dispute. Decision: ${decision}.`,
            referenceId: auctionId
        });
        // General notification — no specific email template needed
    }

    static async notifyWithdrawalApproved(userId: string, amount: number) {
        await this.send({
            userId,
            type: 'PAYMENT_RECEIVED', // Generic match for ledger
            title: '💸 Withdrawal Approved!',
            body: `Your withdrawal request for ₹${amount.toLocaleString()} has been approved and processed.`,
        });
        const contact = await getUserContact(userId);
        if (contact) {
            // Reusing a generic wallet template or adding specific logic
            EmailService.sendDepositSuccess(contact.email, contact.name, amount).catch(() => { });
        }
    }

    static async notifyWithdrawalRejected(userId: string, amount: number, reason: string) {
        await this.send({
            userId,
            type: 'OUTBID', // Red icon match
            title: '❌ Withdrawal Rejected',
            body: `Your withdrawal request for ₹${amount.toLocaleString()} was rejected: ${reason}`,
        });
    }
}
