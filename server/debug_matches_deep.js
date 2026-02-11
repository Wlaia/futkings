const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const championshipId = '67b3ad99-83cd-4bd6-b54e-7be8c1481961';

    const matches = await prisma.match.findMany({
        where: { championshipId: championshipId },
        include: {
            playerStats: {
                include: { player: { select: { name: true } } }
            },
            homeTeam: { select: { name: true } },
            awayTeam: { select: { name: true } }
        },
        orderBy: { round: 'asc' }
    });

    console.log('Total Matches: ' + matches.length);

    for (const m of matches) {
        console.log('\nMatch ' + m.id + ' [' + m.round + '] - Status: ' + m.status);
        console.log('Teams: ' + (m.homeTeam ? m.homeTeam.name : '---') + ' vs ' + (m.awayTeam ? m.awayTeam.name : '---'));
        console.log('Score: ' + m.homeScore + ' - ' + m.awayScore);
        console.log('Stats count: ' + m.playerStats.length);
        for (const s of m.playerStats) {
            console.log('  - Player: ' + (s.player ? s.player.name : '---') + ' | G: ' + s.goals + ' | A: ' + s.assists + ' | Y: ' + s.yellowCards + ' | R: ' + s.redCards);
        }
    }
}

main()
    .catch(function (e) { console.error(e); })
    .finally(function () { prisma.$disconnect(); });
