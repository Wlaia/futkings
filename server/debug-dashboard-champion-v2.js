const prisma = require('./src/utils/prismaClient');

console.log("Starting debug script...");

async function debugChampionship() {
    try {
        console.log("Connecting to database...");
        const championships = await prisma.championship.findMany({
            where: { name: { contains: 'Homologação' } }
        });

        console.log(`Found ${championships.length} championships matching 'Homologação'.`);

        for (const champ of championships) {
            console.log(`\nChampionship: ${champ.name} (ID: ${champ.id}, Status: ${champ.status})`);

            const matches = await prisma.match.findMany({
                where: {
                    championshipId: champ.id,
                    status: 'COMPLETED'
                },
                orderBy: { startTime: 'desc' },
                include: { homeTeam: true, awayTeam: true }
            });

            console.log(`Completed Matches: ${matches.length}`);
            matches.forEach((m, index) => {
                console.log(`[${index}] ${m.homeTeam?.name} ${m.homeScore} x ${m.awayScore} ${m.awayTeam?.name} (Start: ${m.startTime})`);
            });
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

debugChampionship().catch(err => console.error("Fatal:", err));
