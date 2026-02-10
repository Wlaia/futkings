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
        } else if (match.championship.type === 'LEAGUE_WITH_FINAL') {
            await handleLeagueProgression(match);
        }

    } catch (error) {
        console.error("Error advancing tournament:", error);
    }
};

const handleLeagueProgression = async (match) => {
    const { championshipId } = match;

    // 1. Check if all "League" matches are completed
    const activeLeagueMatches = await prisma.match.count({
        where: {
            championshipId,
            round: { startsWith: 'Rodada' },
            status: { not: 'COMPLETED' }
        }
    });

    if (activeLeagueMatches > 0) return; // League not finished

    // 2. Check if Final already exists
    const existingFinal = await prisma.match.findFirst({
        where: { championshipId, round: 'Final' }
    });

    if (existingFinal) return; // Final already created

    // 3. Calculate Standings
    const leagueMatches = await prisma.match.findMany({
        where: {
            championshipId,
            round: { startsWith: 'Rodada' },
            status: 'COMPLETED'
        },
        include: {
            playerStats: {
                include: { player: true }
            }
        }
    });

    const standings = {};

    leagueMatches.forEach(m => {
        const { homeTeamId, awayTeamId, homeScore, awayScore, playerStats } = m;
        if (!homeTeamId || !awayTeamId) return;

        if (!standings[homeTeamId]) standings[homeTeamId] = { id: homeTeamId, points: 0, wins: 0, goalDiff: 0, goalsFor: 0, cards: 0 };
        if (!standings[awayTeamId]) standings[awayTeamId] = { id: awayTeamId, points: 0, wins: 0, goalDiff: 0, goalsFor: 0, cards: 0 };

        standings[homeTeamId].goalsFor += homeScore;
        standings[awayTeamId].goalsFor += awayScore;
        standings[homeTeamId].goalDiff += (homeScore - awayScore);
        standings[awayTeamId].goalDiff += (awayScore - homeScore);

        if (homeScore > awayScore) {
            standings[homeTeamId].points += 3;
            standings[homeTeamId].wins += 1;
        } else if (awayScore > homeScore) {
            standings[awayTeamId].points += 3;
            standings[awayTeamId].wins += 1;
        } else {
            standings[homeTeamId].points += 1;
            standings[awayTeamId].points += 1;
        }

        // Count Cards
        playerStats.forEach(stat => {
            const cardCount = stat.yellowCards + stat.redCards;
            if (stat.player.teamId === homeTeamId) {
                standings[homeTeamId].cards += cardCount;
            } else if (stat.player.teamId === awayTeamId) {
                standings[awayTeamId].cards += cardCount;
            }
        });
    });

    const rankedTeams = Object.values(standings).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
        if (a.cards !== b.cards) return a.cards - b.cards; // Less cards is better
        return b.goalsFor - a.goalsFor;
    });

    // 4. Create Final (Top 2)
    if (rankedTeams.length >= 2) {
        await prisma.match.create({
            data: {
                championshipId,
                round: 'Final',
                homeTeamId: rankedTeams[0].id,
                awayTeamId: rankedTeams[1].id,
                status: 'SCHEDULED'
            }
        });
        console.log(`Final created for championship ${championshipId}: ${rankedTeams[0].id} vs ${rankedTeams[1].id}`);
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
