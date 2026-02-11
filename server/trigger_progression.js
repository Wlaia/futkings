const { PrismaClient } = require('@prisma/client');
const { advanceTournamentRound } = require('./src/services/tournamentService');
const prisma = new PrismaClient();

async function main() {
    const finalMatchId = 'fefec695-7bf8-4114-a670-035a9da53f35';
    console.log('Triggering progression for Final Match:', finalMatchId);

    await advanceTournamentRound(finalMatchId);

    const champ = await prisma.championship.findFirst({
        where: { matches: { some: { id: finalMatchId } } }
    });

    console.log('Championship Status:', champ.status);
    console.log('Championship Name:', champ.name);
}

main()
    .catch(function (e) { console.error(e); })
    .finally(function () { prisma.$disconnect(); });
