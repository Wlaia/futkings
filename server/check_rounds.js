const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const championshipId = '67b3ad99-83cd-4bd6-b54e-7be8c1481961';
    const matches = await prisma.match.findMany({
        where: { championshipId },
        orderBy: { round: 'asc' }
    });

    console.log('All Matches for Championship:');
    matches.forEach(m => {
        console.log(`- [${m.status}] Round: "${m.round}" | ID: ${m.id}`);
    });
}

main().finally(() => prisma.$disconnect());
