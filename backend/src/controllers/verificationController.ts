import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

// ─────────────────────────────────────────────
// POST /api/v1/verification/apply
// User submits their seller verification request
// ─────────────────────────────────────────────
export const applyForVerification = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { fullLegalName, businessType, panNumber, aadhaarLast4, documentUrls, assetUrls, description } = req.body;

        if (!fullLegalName || !businessType || !description) {
            return res.status(400).json({ error: 'Full legal name, business type, and description are required.' });
        }

        // Check if user already has a pending or under-review request
        const existing = await prisma.sellerVerificationRequest.findFirst({
            where: { userId, status: { in: ['PENDING', 'UNDER_REVIEW'] } }
        });

        if (existing) {
            return res.status(409).json({
                error: 'You already have a pending verification request. Please wait for admin review.',
                request: existing
            });
        }

        const request = await prisma.sellerVerificationRequest.create({
            data: {
                userId,
                fullLegalName,
                businessType,
                panNumber: panNumber || null,
                aadhaarLast4: aadhaarLast4 || null,
                documentUrls: documentUrls || [],
                assetUrls: assetUrls || [],
                description,
                status: 'PENDING'
            }
        });

        return res.status(201).json({ message: 'Verification request submitted successfully! An admin will review it soon.', request });
    } catch (error) {
        console.error('[Verification] Apply error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// GET /api/v1/verification/my-status
// User checks their own verification request status
// ─────────────────────────────────────────────
export const getMyVerificationStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const request = await prisma.sellerVerificationRequest.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        return res.status(200).json({ request });
    } catch (error) {
        console.error('[Verification] Get-status error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// GET /api/v1/verification/admin/pending  [ADMIN]
// Admin lists all pending requests
// ─────────────────────────────────────────────
export const getPendingVerifications = async (req: AuthRequest, res: Response) => {
    try {
        const { status = 'PENDING', page = '1', limit = '20' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const [requests, total] = await Promise.all([
            prisma.sellerVerificationRequest.findMany({
                where: { status: String(status) as any },
                skip, take: Number(limit),
                orderBy: { createdAt: 'asc' },
                include: {
                    user: {
                        select: {
                            id: true, fullName: true, email: true,
                            role: true, verifiedStatus: true, trustScore: true,
                            suspiciousFlags: true, createdAt: true,
                            _count: { select: { auctionsAsSeller: true, bidsPlaced: true } }
                        }
                    }
                }
            }),
            prisma.sellerVerificationRequest.count({ where: { status: String(status) as any } })
        ]);

        return res.status(200).json({
            requests,
            pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) }
        });
    } catch (error) {
        console.error('[Verification] Get-pending error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// PATCH /api/v1/verification/admin/:id/review  [ADMIN]
// Admin approves or rejects a verification request
// ─────────────────────────────────────────────
export const reviewVerification = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { decision, adminNotes } = req.body; // decision: 'APPROVED' | 'REJECTED'
        const adminId = req.user!.id;

        if (!decision || !['APPROVED', 'REJECTED'].includes(decision)) {
            return res.status(400).json({ error: "Decision must be 'APPROVED' or 'REJECTED'." });
        }

        const verificationReq = await prisma.sellerVerificationRequest.findUnique({ where: { id } });
        if (!verificationReq) {
            return res.status(404).json({ error: 'Verification request not found.' });
        }

        // Use a transaction to update the request AND the user atomically
        const result = await prisma.$transaction(async (tx) => {
            // Update the verification request
            const updatedRequest = await tx.sellerVerificationRequest.update({
                where: { id },
                data: {
                    status: decision,
                    adminNotes: adminNotes || null,
                    reviewedById: adminId
                }
            });

            // If approved, promote the user to SELLER with VERIFIED status
            let updatedUser = null;
            if (decision === 'APPROVED') {
                updatedUser = await tx.user.update({
                    where: { id: verificationReq.userId },
                    data: { role: 'SELLER', verifiedStatus: 'VERIFIED' }
                });
            }

            // Log the admin action
            await tx.adminActionLog.create({
                data: {
                    adminId,
                    action: `SELLER_VERIFICATION_${decision}`,
                    targetId: verificationReq.userId,
                    targetType: 'USER',
                    notes: adminNotes || `Verification ${decision.toLowerCase()}.`
                }
            });

            return { updatedRequest, updatedUser };
        });

        return res.status(200).json({
            message: `Verification ${decision === 'APPROVED' ? 'approved! User is now a Verified Seller.' : 'rejected.'}`,
            ...result
        });
    } catch (error) {
        console.error('[Verification] Review error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
