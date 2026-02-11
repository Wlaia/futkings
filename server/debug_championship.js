const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const championshipName = 'FUTKINGS EXPERIENCE 1º EDIÇÃO';

    const champ = await prisma.championship.findFirst({
        where: { name: { contains: 'FUTKINGS', mode: 'insensitive' } },
        include: {
            matches: {
                include: {
                    homeTeam: { select: { name: true } },
                    awayTeam: { select: { name: true } }
                },
                orderBy: { round: 'asc' }
            }
        }
    });

    if (!champ) {
        console.log('Championship not found');
        return;
    }

    console.log('--- Championship Info ---');
    console.log('ID:', champ.id);
    console.log('Name:', champ.name);
    console.log('Type:', champ.type);
    console.log('Status:', champ.status);
    console.log('\n--- Matches ---');
    champ.matches.forEach(m => {
        const home = m.homeTeam?.name || '---';
        const away = m.awayTeam?.name || '---';
        console.log(`[${m.status}] ${m.round}: ${home} (${m.homeScore}) vs ${away} (${m.awayScore})`);
        console.log(`    IDs: ${m.homeTeamId} vs ${m.awayTeamId}`);
    });

    const activeLeagueMatches = await prisma.match.count({
        where: {
            championshipId: champ.id,
            round: { startsWith: 'Rodada' },
            status: { not: 'COMPLETED' }
        }
    });
    console.log('\nActive League Matches:', activeLeagueMatches);
    console.log('Total matches count:', champ.matches.length);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
