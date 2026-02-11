const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const championshipId = '67b3ad99-83cd-4bd6-b54e-7be8c1481961';

    const champ = await prisma.championship.findUnique({
        where: { id: championshipId },
        include: {
            matches: {
                include: {
                    homeTeam: { select: { name: true } },
                    awayTeam: { select: { name: true } }
                }
            }
        }
    });

    console.log('Championship:', champ.name);

    console.log('\nMatches List:');
    champ.matches.forEach(m => {
        // console.log(`- [${m.status}] ${m.round}: ${m.homeTeam?.name || 'A Definir'} vs ${m.awayTeam?.name || 'A Definir'} | Updated: ${m.updatedAt}`);
        // Wait, Match model might not have updatedAt? Let me check schema.
    });
}
// Checking schema again...
main().finally(() => prisma.$disconnect());
