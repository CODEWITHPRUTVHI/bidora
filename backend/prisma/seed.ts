/**
 * Seeds initial mock data (Categories, Users, Auctions) for development/testing
 */
import { PrismaClient, UserRole, VerifiedStatus, AuctionStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting DB seed...');

    // 1. Seed Categories
    const categories = ['Watches', 'Sneakers', 'Fashion', 'Collectibles', 'Art', 'Electronics', 'Vehicles'];
    for (const name of categories) {
        await prisma.category.upsert({
            where: { name },
            update: {},
            create: { name, slug: name.toLowerCase() },
        });
    }
    console.log(`✅ Seeded ${categories.length} categories`);

    // 2. Seed Mock Users
    // password = password123
    const defaultPasswordHash = '$2b$10$0I0GC2wUoywtWDOwYoLR.OVP/tPQfEemDc1Mnm7/iSWj9GrwP1IoO';

    const seller = await prisma.user.upsert({
        where: { email: 'seller@test.com' },
        update: {},
        create: {
            email: 'seller@test.com',
            fullName: 'Trusted Seller Inc.',
            passwordHash: defaultPasswordHash,
            role: UserRole.SELLER,
            verifiedStatus: VerifiedStatus.VERIFIED,
            trustScore: 4.8,
            walletBalance: 0,
        }
    });

    const buyer = await prisma.user.upsert({
        where: { email: 'buyer@test.com' },
        update: {},
        create: {
            email: 'buyer@test.com',
            fullName: 'John Collector',
            passwordHash: defaultPasswordHash,
            role: UserRole.BUYER,
            walletBalance: 250000, // 250,000 INR test balance
        }
    });

    console.log(`✅ Seeded 2 test users (seller@test.com, buyer@test.com) - password: password123`);

    // 3. Seed an active test auction
    const watchesCategory = await prisma.category.findUnique({ where: { name: 'Watches' } });

    if (watchesCategory) {
        // End time = 24 hours from now
        const endTime = new Date();
        endTime.setHours(endTime.getHours() + 24);

        const testAuction = await prisma.auction.create({
            data: {
                title: 'Rolex Submariner Date (2023, Unworn)',
                description: 'Brand new, with box and papers. 41mm Oystersteel casing.',
                startingPrice: 50000,
                currentHighestBid: 50000,
                bidIncrement: 5000,
                startTime: new Date(),
                endTime: endTime,
                status: AuctionStatus.LIVE,
                sellerId: seller.id,
                categoryId: watchesCategory.id,
                imageUrls: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'],
            }
        });
        console.log(`✅ Seeded live test auction: ${testAuction.title}`);
    }

    console.log('🎉 Seeding complete!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
