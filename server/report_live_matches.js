const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const liveMatches = await prisma.match.findMany({
        where: { status: 'LIVE' },
        include: {
            homeTeam: { select: { name: true } },
            awayTeam: { select: { name: true } },
            championship: { select: { name: true } }
        },
        orderBy: { startTime: 'asc' }
    });

    fs.writeFileSync('live_matches_report.json', JSON.stringify(liveMatches, null, 2));
    console.log(`Saved ${liveMatches.length} live matches to live_matches_report.json`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
