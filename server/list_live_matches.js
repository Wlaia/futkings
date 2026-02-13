const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const liveMatches = await prisma.match.findMany({
        where: { status: 'LIVE' },
        include: {
            homeTeam: { select: { name: true } },
            awayTeam: { select: { name: true } },
            championship: { select: { name: true } }
        }
    });

    console.log('Total LIVE Matches: ' + liveMatches.length);

    console.log('LIVE_MATCHES_START');
    console.log(JSON.stringify(liveMatches, null, 2));
    console.log('LIVE_MATCHES_END');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
