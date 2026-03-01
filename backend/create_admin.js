
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const adminEmail = 'admin@bidora.com';
    const passwordHash = '$2b$10$0I0GC2wUoywtWDOwYoLR.OVP/tPQfEemDc1Mnm7/iSWj9GrwP1IoO'; // password123

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: { role: 'ADMIN' },
        create: {
            email: adminEmail,
            fullName: 'System Administrator',
            passwordHash: passwordHash,
            role: 'ADMIN',
            verifiedStatus: 'VERIFIED',
            isEmailVerified: true
        }
    });
    console.log(JSON.stringify(admin, null, 2));
    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
