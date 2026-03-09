import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { qs } from '../utils/queryHelpers';
import * as shippo from 'shippo';

// Ensure the Shippo token matches your environment variables
const shippoToken = process.env.SHIPPO_API_TOKEN;
if (!shippoToken) {
    console.warn('[Shipping] WARNING: SHIPPO_API_TOKEN is not defined in environment variables.');
}
const shippoClient = new shippo.Shippo({ apiKeyHeader: shippoToken || '' });

// ─────────────────────────────────────────────
// POST /api/v1/shipping/address
// ─────────────────────────────────────────────
export const addAddress = async (req: AuthRequest, res: Response) => {
    try {
        const { fullName, line1, line2, city, state, pincode, country, phone, isDefault } = req.body;

        if (!fullName || !line1 || !city || !state || !pincode) {
            return res.status(400).json({ error: 'fullName, line1, city, state, and pincode are required' });
        }

        if (isDefault) {
            await prisma.shippingAddress.updateMany({
                where: { userId: req.user!.id, isDefault: true },
                data: { isDefault: false }
            });
        }

        const address = await prisma.shippingAddress.create({
            data: {
                userId: req.user!.id,
                fullName,
                line1,
                line2: line2 || null,
                city,
                state,
                pincode,
                country: country || 'IN',
                phone: phone || null,
                isDefault: !!isDefault
            }
        });

        return res.status(201).json({ address });
    } catch (error) {
        console.error('[Shipping] Add address error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// GET /api/v1/shipping/address
// ─────────────────────────────────────────────
export const getAddresses = async (req: AuthRequest, res: Response) => {
    try {
        const addresses = await prisma.shippingAddress.findMany({
            where: { userId: req.user!.id },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
        });
        return res.status(200).json({ addresses });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// POST /api/v1/shipping/:auctionId/ship
// ─────────────────────────────────────────────
export const markAsShipped = async (req: AuthRequest, res: Response) => {
    try {
        const { auctionId } = req.params;
        const trackingNumber: string = req.body.trackingNumber;
        const courier: string = req.body.courier;

        if (!trackingNumber || !courier) {
            return res.status(400).json({ error: 'trackingNumber and courier are required' });
        }

        const auction = await prisma.auction.findUnique({
            where: { id: auctionId },
            select: { sellerId: true, status: true }
        });

        if (!auction) return res.status(404).json({ error: 'Auction not found' });
        if (auction.sellerId !== req.user!.id) return res.status(403).json({ error: 'Only the seller can mark as shipped' });
        if (auction.status !== 'PAID') return res.status(400).json({ error: 'Auction must be PAID before shipping' });

        const releaseDays = Number(process.env.ESCROW_AUTO_RELEASE_DAYS || 14);
        const autoReleaseAt = new Date(Date.now() + releaseDays * 24 * 60 * 60 * 1000);

        const result = await prisma.$transaction(async (tx) => {
            const updatedAuction = await tx.auction.update({
                where: { id: auctionId },
                data: { status: 'SHIPPED' }
            });

            const shippingDetail = await tx.shippingDetail.upsert({
                where: { auctionId },
                create: { auctionId, trackingNumber, courier, status: 'IN_TRANSIT', shippedAt: new Date() },
                update: { trackingNumber, courier, status: 'IN_TRANSIT', shippedAt: new Date() }
            });

            await tx.escrowPayment.update({
                where: { auctionId },
                data: { autoReleaseAt }
            });

            return { updatedAuction, shippingDetail };
        });

        return res.status(200).json({
            message: 'Shipment confirmed. Escrow auto-release scheduled.',
            auction: result.updatedAuction,
            shippingDetail: result.shippingDetail,
            autoReleaseAt
        });
    } catch (error) {
        console.error('[Shipping] Mark shipped error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// POST /api/v1/shipping/:auctionId/auto-label
// ─────────────────────────────────────────────
export const autoGenerateLabel = async (req: AuthRequest, res: Response) => {
    try {
        const { auctionId } = req.params;

        // Verify auction and seller privileges
        const auction = await prisma.auction.findUnique({
            where: { id: auctionId },
            include: { seller: true }
        });

        if (!auction) return res.status(404).json({ error: 'Auction not found' });
        if (auction.sellerId !== req.user!.id) return res.status(403).json({ error: 'Only the seller can generate a label' });
        if (auction.status !== 'PAID') return res.status(400).json({ error: 'Auction must be PAID before generating a label' });

        // Retrieve the saved shipping detail and buyer's address
        const shippingDetail = await prisma.shippingDetail.findUnique({
            where: { auctionId },
            include: { buyerAddress: true }
        });

        if (!shippingDetail || !shippingDetail.buyerAddress) {
            return res.status(400).json({ error: 'Buyer address not provided or missing.' });
        }

        const buyerAddress = shippingDetail.buyerAddress;

        // Shippo Address From (Mocked Seller Address for demo)
        const addressFrom = await shippoClient.addresses.create({
            name: auction.seller.fullName || 'Seller',
            street1: '123 Seller Lane',
            city: 'Mumbai',
            state: 'MH',
            zip: '400001',
            country: 'IN',
            phone: '+919876543210',
            email: auction.seller.email || 'seller@example.com'
        });

        // Shippo Address To (Buyer's real address)
        const addressTo = await shippoClient.addresses.create({
            name: buyerAddress.fullName,
            street1: buyerAddress.line1,
            street2: buyerAddress.line2 || '',
            city: buyerAddress.city,
            state: buyerAddress.state,
            zip: buyerAddress.pincode,
            country: buyerAddress.country,
            phone: buyerAddress.phone || '+910000000000',
            email: 'buyer@bidora.local' // Placeholder if no buyer email readily available
        });

        // The Parcel
        const parcel = await shippoClient.parcels.create({
            length: '5',
            width: '5',
            height: '5',
            distanceUnit: 'in',
            weight: '2',
            massUnit: 'lb'
        });

        // Create the shipment
        const shipment = await shippoClient.shipments.create({
            addressFrom: addressFrom.objectId || '',
            addressTo: addressTo.objectId || '',
            parcels: [parcel.objectId || ''],
            async: false
        });

        // Pick the cheapest rate automatically
        const rates = shipment.rates || [];
        if (rates.length === 0) {
            return res.status(400).json({ error: 'No shipping rates found for this route.' });
        }

        const cheapestRate = rates.reduce((prev: any, curr: any) => parseFloat(prev.amount) < parseFloat(curr.amount) ? prev : curr);

        // Buy the label
        const transaction = await shippoClient.transactions.create({
            rate: cheapestRate.objectId,
            labelFileType: 'PDF',
            async: false
        });

        if (transaction.status !== 'SUCCESS') {
            return res.status(400).json({ error: 'Failed to purchase shipping label', details: transaction.messages });
        }

        // ── Transaction Success! Apply to Database ──

        const releaseDays = Number(process.env.ESCROW_AUTO_RELEASE_DAYS || 14);
        const autoReleaseAt = new Date(Date.now() + releaseDays * 24 * 60 * 60 * 1000);

        const result = await prisma.$transaction(async (tx) => {
            const updatedAuction = await tx.auction.update({
                where: { id: auctionId },
                data: { status: 'SHIPPED' } // We automatically mark it shipped upon label printing
            });

            const updatedShippingDetail = await tx.shippingDetail.update({
                where: { auctionId },
                data: {
                    trackingNumber: transaction.trackingNumber,
                    courier: cheapestRate.provider,
                    status: 'IN_TRANSIT',
                    shippedAt: new Date(),
                    trackingUrl: transaction.trackingUrlProvider,
                    labelUrl: transaction.labelUrl
                }
            });

            await tx.escrowPayment.update({
                where: { auctionId },
                data: { autoReleaseAt }
            });

            return { updatedAuction, updatedShippingDetail };
        });

        return res.status(200).json({
            message: 'Shipping label generated automatically!',
            trackingNumber: transaction.trackingNumber,
            labelUrl: transaction.labelUrl,
            courier: cheapestRate.provider,
            auction: result.updatedAuction,
            shippingDetail: result.updatedShippingDetail,
            autoReleaseAt
        });

    } catch (error: any) {
        console.error('[Shipping] Auto Label error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error while generating label' });
    }
};

// ─────────────────────────────────────────────
// POST /api/v1/shipping/:auctionId/delivered
// ─────────────────────────────────────────────
export const markAsDelivered = async (req: AuthRequest, res: Response) => {
    try {
        const { auctionId } = req.params;

        const auction = await prisma.auction.findUnique({
            where: { id: auctionId },
            select: { sellerId: true, status: true }
        });

        if (!auction) return res.status(404).json({ error: 'Auction not found' });
        if (auction.sellerId !== req.user!.id) return res.status(403).json({ error: 'Only the seller can mark as delivered' });
        if (auction.status !== 'SHIPPED') return res.status(400).json({ error: 'Auction must be SHIPPED before marking as delivered' });

        await prisma.$transaction(async (tx) => {
            await tx.auction.update({
                where: { id: auctionId },
                data: { status: 'DELIVERED' }
            });

            await tx.shippingDetail.update({
                where: { auctionId },
                data: { status: 'DELIVERED', deliveredAt: new Date() }
            });
        });

        return res.status(200).json({ message: 'Order marked as delivered. Awaiting buyer confirmation.' });
    } catch (error) {
        console.error('[Shipping] Mark delivered error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// POST /api/v1/shipping/:auctionId/confirm
// ─────────────────────────────────────────────
export const confirmDelivery = async (req: AuthRequest, res: Response) => {
    try {
        const { auctionId } = req.params;

        const escrow = await prisma.escrowPayment.findUnique({
            where: { auctionId },
            select: { buyerId: true, status: true }
        });

        if (!escrow) return res.status(404).json({ error: 'Escrow not found' });
        if (escrow.buyerId !== req.user!.id) return res.status(403).json({ error: 'Only the buyer can confirm delivery' });
        if (escrow.status !== 'HELD') return res.status(400).json({ error: 'Escrow is not in a releasable state' });

        const auction = await prisma.auction.findUnique({
            where: { id: auctionId },
            select: { status: true }
        });
        if (!auction || auction.status !== 'DELIVERED') {
            return res.status(400).json({ error: 'Order must be marked as DELIVERED before final confirmation' });
        }

        const { EscrowService } = await import('../services/escrowService');

        // Update shipping detail
        await prisma.shippingDetail.update({ where: { auctionId }, data: { status: 'DELIVERED' } });

        // EscrowService handles the atomic release logic, including transitioning the auction to COMPLETED.
        await EscrowService.releaseEscrow(auctionId);

        return res.status(200).json({ message: 'Delivery confirmed. Escrow released to seller.' });
    } catch (error: any) {
        console.error('[Shipping] Confirm delivery error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// GET /api/v1/shipping/:auctionId
// ─────────────────────────────────────────────
export const getShippingDetail = async (req: AuthRequest, res: Response) => {
    try {
        const detail = await prisma.shippingDetail.findUnique({
            where: { auctionId: req.params.auctionId },
            include: { buyerAddress: true }
        });
        if (!detail) return res.status(404).json({ error: 'Shipping detail not found' });
        return res.status(200).json({ shippingDetail: detail });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};
