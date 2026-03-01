import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { NotificationService } from '../services/notificationService';

// ─────────────────────────────────────────────
// POST /api/v1/disputes
// ─────────────────────────────────────────────
export const openDispute = async (req: AuthRequest, res: Response) => {
    try {
        const { auctionId, reason, evidenceUrls } = req.body;

        if (!auctionId || !reason) return res.status(400).json({ error: 'auctionId and reason are required' });
        if (reason.length < 20) return res.status(400).json({ error: 'Please provide at least 20 characters explaining the issue' });

        const escrow = await prisma.escrowPayment.findUnique({
            where: { auctionId },
            select: { buyerId: true, sellerId: true, status: true }
        });

        if (!escrow) return res.status(404).json({ error: 'Escrow not found for this auction' });
        if (escrow.buyerId !== req.user!.id) return res.status(403).json({ error: 'Only the buyer can open a dispute' });
        if (!['HELD', 'RELEASED'].includes(escrow.status)) {
            return res.status(400).json({ error: 'Dispute can only be raised when escrow is held or released' });
        }

        const existing = await prisma.dispute.findFirst({ where: { auctionId } });
        if (existing) return res.status(409).json({ error: 'A dispute already exists for this auction' });

        const result = await prisma.$transaction(async (tx) => {
            // Freeze escrow
            await tx.escrowPayment.update({ where: { auctionId }, data: { status: 'DISPUTED' } });

            // Create dispute
            const dispute = await tx.dispute.create({
                data: {
                    auctionId,
                    buyerId: escrow.buyerId,
                    reason,
                    status: 'OPEN',
                    evidenceUrls: Array.isArray(evidenceUrls) ? evidenceUrls : []
                }
            });

            // Log fraud event using valid FraudEventType
            await tx.fraudEvent.create({
                data: {
                    userId: escrow.buyerId,
                    eventType: 'PAYMENT_GHOST',   // Closest valid enum for payment disputes
                    auctionId,
                    metadata: { reason: reason.slice(0, 100) }
                }
            });

            return dispute;
        });

        // Notify seller separately (using auctionId to look up seller)
        await NotificationService.notifyDisputeOpened(escrow.sellerId, auctionId, reason.slice(0, 80));

        return res.status(201).json({ dispute: result, message: 'Dispute opened. Admin will review within 48 hours.' });
    } catch (error) {
        console.error('[Dispute] Open error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// GET /api/v1/disputes/my
// ─────────────────────────────────────────────
export const getMyDisputes = async (req: AuthRequest, res: Response) => {
    try {
        // Dispute only has buyerId relation in schema; find by auction's sellerId separately
        const disputes = await prisma.dispute.findMany({
            where: { buyerId: req.user!.id },
            orderBy: { createdAt: 'desc' },
            include: { auction: { select: { id: true, title: true, imageUrls: true } } }
        });
        return res.status(200).json({ disputes });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// GET /api/v1/disputes/admin  (Admin: all disputes)
// ─────────────────────────────────────────────
export const getAllDisputes = async (req: AuthRequest, res: Response) => {
    try {
        const status = req.query.status as string;
        const where: any = {};
        if (status) where.status = status;

        const disputes = await prisma.dispute.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                auction: { select: { id: true, title: true, imageUrls: true, currentHighestBid: true, sellerId: true } },
                buyer: { select: { id: true, fullName: true, email: true, trustScore: true } }
            }
        });

        return res.status(200).json({ disputes, total: disputes.length });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// PATCH /api/v1/disputes/:id/resolve  (Admin)
// ─────────────────────────────────────────────
export const resolveDispute = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { decision, adminNote } = req.body;
        // decision: 'REFUND_BUYER' | 'RELEASE_SELLER' | 'PARTIAL_REFUND'

        if (!decision || !['REFUND_BUYER', 'RELEASE_SELLER', 'PARTIAL_REFUND'].includes(decision)) {
            return res.status(400).json({ error: 'Decision must be REFUND_BUYER, RELEASE_SELLER, or PARTIAL_REFUND' });
        }

        const dispute = await prisma.dispute.findUnique({
            where: { id },
            include: { auction: { select: { title: true, sellerId: true } } }
        });
        if (!dispute) return res.status(404).json({ error: 'Dispute not found' });
        if (dispute.status !== 'OPEN') return res.status(400).json({ error: 'Dispute is already resolved' });

        const { EscrowService } = await import('../services/escrowService');
        await EscrowService.resolveDispute(dispute.id, req.user!.id, decision as any, adminNote || '');

        // Map decision to schema DisputeStatus enum
        const statusMap: Record<string, any> = {
            'REFUND_BUYER': 'RESOLVED_REFUND_BUYER',
            'RELEASE_SELLER': 'RESOLVED_RELEASE_SELLER',
            'PARTIAL_REFUND': 'RESOLVED_REFUND_BUYER'
        };

        const updated = await prisma.dispute.update({
            where: { id },
            data: {
                status: statusMap[decision],
                adminNotes: adminNote || null,
                resolvedById: req.user!.id
            }
        });

        await prisma.adminActionLog.create({
            data: {
                adminId: req.user!.id,
                action: 'DISPUTE_RESOLVED',
                targetId: id,
                targetType: 'DISPUTE',
                notes: `${decision}: ${adminNote || 'no note'}`
            }
        });

        // Notify buyer and seller
        const sellerId = dispute.auction?.sellerId;
        await Promise.all([
            NotificationService.notifyDisputeResolved(dispute.buyerId, dispute.auctionId, decision),
            sellerId ? NotificationService.notifyDisputeResolved(sellerId, dispute.auctionId, decision) : Promise.resolve()
        ]);

        return res.status(200).json({ dispute: updated, message: `Dispute resolved: ${decision}` });
    } catch (error: any) {
        console.error('[Dispute] Resolve error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
