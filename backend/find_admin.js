
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { email: true }
    });
    console.log(JSON.stringify(admins));
    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
