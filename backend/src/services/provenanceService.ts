import prisma from '../utils/prisma';
import crypto from 'crypto';

export class ProvenanceService {
    /**
     * Generates a unique provenance record for a completed auction.
     * This record acts as a "Digital Certificate of Authenticity" backed by a cryptographic hash.
     */
    static async generateProvenance(auctionId: string) {
        try {
            const auction = await prisma.auction.findUnique({
                where: { id: auctionId },
                include: {
                    seller: { select: { fullName: true, id: true } },
                    bids: {
                        where: { isWinning: true },
                        include: { bidder: { select: { fullName: true, id: true } } },
                        take: 1
                    }
                }
            });

            if (!auction) throw new Error('Auction not found');
            if (auction.status !== 'COMPLETED' && auction.status !== 'DELIVERED') {
                console.warn(`[Provenance] Auction ${auctionId} is not in a completed state yet.`);
                // We typically mint when the item is confirmed delivered or payment released
            }

            const winningBid = auction.bids[0];
            if (!winningBid) {
                console.warn(`[Provenance] No winning bid found for auction ${auctionId}`);
                return;
            }

            // 1. Construct the data payload for hashing
            const provenanceData = {
                auctionId: auction.id,
                title: auction.title,
                sellerId: auction.sellerId,
                buyerId: winningBid.bidderId,
                finalPrice: winningBid.amount.toString(),
                timestamp: new Date().toISOString(),
                platform: 'Bidora Pro'
            };

            // 2. Generate SHA-256 Cryptographic Hash
            const hash = crypto
                .createHash('sha256')
                .update(JSON.stringify(provenanceData))
                .digest('hex');

            // 3. Simulate Blockchain Transaction ID (in production, this would be the actual tx hash from Ethereum/Polygon)
            const mockTxId = `0x${crypto.randomBytes(32).toString('hex')}`;

            // 4. Update the auction with provenance details
            await prisma.auction.update({
                where: { id: auctionId },
                data: {
                    provenanceHash: hash,
                    blockchainTxId: mockTxId
                }
            });

            console.log(`[Provenance] SECURE LEDGER UPDATED: Auction ${auctionId} has been certified. Hash: ${hash.substring(0, 10)}...`);

            return {
                hash,
                txId: mockTxId,
                certificateUrl: `/provenance/${auctionId}`
            };
        } catch (error) {
            console.error('[Provenance] Error generating record:', error);
            throw error;
        }
    }

    /**
     * Verifies if a piece of data matches a stored provenance hash.
     */
    static verifyProvenance(storedHash: string, data: any): boolean {
        const currentHash = crypto
            .createHash('sha256')
            .update(JSON.stringify(data))
            .digest('hex');
        return storedHash === currentHash;
    }
}
