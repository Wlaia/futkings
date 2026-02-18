const prisma = require('./src/utils/prismaClient');

async function debugChampionship() {
    try {
        const championship = await prisma.championship.findFirst({
            where: { name: { contains: 'Homologação' } },
            include: {
                matches: {
                    where: { status: 'COMPLETED' },
                    orderBy: { startTime: 'desc' },
                    include: { homeTeam: true, awayTeam: true }
                }
            }
        });

        if (!championship) {
            console.log("Championship 'Homologação' not found.");
            return;
        }

        console.log(`Championship: ${championship.name} (Status: ${championship.status})`);
        console.log("Completed Matches (Ordered by StartTime DESC):");

        championship.matches.forEach((m, index) => {
            console.log(`[${index}] ${m.homeTeam.name} ${m.homeScore} x ${m.awayScore} ${m.awayTeam.name} (Start: ${m.startTime})`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

debugChampionship();
