const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const championshipId = '67b3ad99-83cd-4bd6-b54e-7be8c1481961';

    const finalMatch = await prisma.match.findFirst({
        where: { championshipId, round: 'Final' },
        include: {
            homeTeam: true,
            awayTeam: true,
            playerStats: true
        }
    });

    if (!finalMatch) {
        console.log('Final match not found');
        return;
    }

    console.log('--- Final Match Details ---');
    console.log('ID:', finalMatch.id);
    console.log('Status:', finalMatch.status);
    console.log('Home:', finalMatch.homeTeam?.name, 'Score:', finalMatch.homeScore);
    console.log('Away:', finalMatch.awayTeam?.name, 'Score:', finalMatch.awayScore);
    console.log('Player Stats count:', finalMatch.playerStats.length);
    console.log('Updated At:', finalMatch.updatedAt);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
