const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const matchId = 'fefec695-7bf8-4114-a670-035a9da53f35';

    console.log('Resetting match:', matchId);

    // 1. Delete player stats for this match
    const deletedStats = await prisma.playerMatchStat.deleteMany({
        where: { matchId: matchId }
    });
    console.log('Deleted player stats:', deletedStats.count);

    // 2. Reset match status and scores
    const updatedMatch = await prisma.match.update({
        where: { id: matchId },
        data: {
            status: 'SCHEDULED',
            homeScore: null,
            awayScore: null
        }
    });

    console.log('Match reset successfully:', updatedMatch.id, updatedMatch.status);
}

main()
    .catch(function (e) { console.error(e); })
    .finally(function () { prisma.$disconnect(); });
