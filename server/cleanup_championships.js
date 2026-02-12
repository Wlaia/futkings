const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Iniciando Limpeza de Dados de Teste ---');

    try {
        // 1. Deletar todas as estatísticas de partidas de jogadores
        console.log('Deletando estatísticas de partidas...');
        await prisma.playerMatchStat.deleteMany({});

        // 2. Deletar todas as partidas
        console.log('Deletando partidas...');
        await prisma.match.deleteMany({});

        // 3. Dissociar times dos campeonatos e resetar estatísticas
        console.log('Resetando estatísticas de times e removendo vínculos com campeonatos...');
        await prisma.team.updateMany({
            data: {
                championshipId: null,
                matchesPlayed: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                goalsFor: 0,
                goalsAgainst: 0
            }
        });

        // 4. Resetar estatísticas globais de jogadores
        console.log('Resetando estatísticas globais de jogadores...');
        await prisma.player.updateMany({
            data: {
                goals: 0,
                assists: 0,
                yellowCards: 0,
                redCards: 0,
                saves: 0,
                goalsConceded: 0,
                fouls: 0
            }
        });

        // 5. Deletar todos os campeonatos
        console.log('Deletando todos os campeonatos...');
        const result = await prisma.championship.deleteMany({});

        console.log(`--- Limpeza concluída com sucesso! ---`);
        console.log(`Campeonatos removidos: ${result.count}`);

    } catch (error) {
        console.error('Erro durante a limpeza:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
