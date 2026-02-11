const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const matchId = 'fefec695-7bf8-4114-a670-035a9da53f35';
    const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: { playerStats: true }
    });

    console.log('Match Detail:');
    console.log('ID:', match.id);
    console.log('Status:', match.status);
    console.log('Home Score:', match.homeScore);
    console.log('Away Score:', match.awayScore);
    console.log('Player Stats Count:', match.playerStats.length);
}

main().finally(() => prisma.$disconnect());
