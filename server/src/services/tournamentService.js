const prisma = require('../utils/prismaClient');

const advanceTournamentRound = async (matchId) => {
    try {
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: { championship: true }
        });

        if (!match || !match.championshipId || match.status !== 'COMPLETED') return;

        // Logic for KNOCKOUT_ONLY (4 teams -> 2 Semis -> 1 Final)
        // User specific rule: "Teve os dois jogos eliminatórios, os dois vencedores fazem a final"
        if (match.championship.type === 'KNOCKOUT_ONLY') {
            await handleKnockoutProgression(match);
        }

    } catch (error) {
        console.error("Error advancing tournament:", error);
    }
};

const handleKnockoutProgression = async (match) => {
    const { championshipId, homeScore, awayScore, homeTeamId, awayTeamId, round } = match;

    let winnerId = null;
    if (homeScore > awayScore) winnerId = homeTeamId;
    else if (awayScore > homeScore) winnerId = awayTeamId;
    else {
        // Handle Draw? For now assuming there's a winner (penalties logic is client-side visually but score determines winner)
        // If draw, we might need a tie-breaker logic or strictly require a winner.
        return;
    }

    if (!winnerId) return;

    // Determine Next Round
    let nextRound = null;
    if (round === 'Round 1') nextRound = 'Final';
    else if (round.includes('Semi')) nextRound = 'Final';

    if (!nextRound) return;

    // Find or Create Next Match
    // We look for a match in the next round that has an empty slot
    let nextMatch = await prisma.match.findFirst({
        where: {
            championshipId,
            round: nextRound,
            OR: [
                { homeTeamId: null },
                { awayTeamId: null }
            ]
        }
    });

    if (nextMatch) {
        // Fill empty slot
        const updateData = {};
        if (!nextMatch.homeTeamId) updateData.homeTeamId = winnerId;
        else if (!nextMatch.awayTeamId) updateData.awayTeamId = winnerId;

        await prisma.match.update({
            where: { id: nextMatch.id },
            data: updateData
        });
    } else {
        // Create new match for next round (if it doesn't exist at all yet)
        // Check if a Final match already exists (maybe full?)
        const existingFinal = await prisma.match.findFirst({
            where: { championshipId, round: nextRound }
        });

        if (!existingFinal) {
            await prisma.match.create({
                data: {
                    championshipId,
                    round: nextRound,
                    homeTeamId: winnerId,
                    status: 'SCHEDULED'
                }
            });
        }
    }
};

module.exports = { advanceTournamentRound };
