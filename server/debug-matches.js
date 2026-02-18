const prisma = require('./src/utils/prismaClient');

async function debugMatches() {
    try {
        const champ = await prisma.championship.findUnique({
            where: { id: 'a5a14fd0-27dd-4abf-890a-591ef2c4519e' },
            include: {
                matches: {
                    where: { status: 'COMPLETED' },
                    orderBy: { startTime: 'desc' },
                    include: { homeTeam: true, awayTeam: true }
                }
            }
        });

        if (!champ) {
            console.log("Championship not found.");
            return;
        }

        console.log(`\nMatches for ${champ.name}:`);
        champ.matches.forEach(m => {
            console.log(`ID: ${m.id}`);
            console.log(`  Round: ${m.round}`);
            console.log(`  Start: ${m.startTime ? m.startTime.toISOString() : 'NULL'}`);
            console.log(`  Result: ${m.homeTeam.name} ${m.homeScore} x ${m.awayScore} ${m.awayTeam.name}`);
            console.log('---');
        });

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

debugMatches();
