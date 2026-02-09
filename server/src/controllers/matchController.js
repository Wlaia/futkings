const prisma = require('../utils/prismaClient');
const { advanceTournamentRound } = require('../services/tournamentService');

const listMatches = async (req, res) => {
    try {
        const matches = await prisma.match.findMany({
            include: { homeTeam: true, awayTeam: true }
        });
        res.json(matches);
    } catch (error) {
        res.status(500).json({ message: 'Error listing matches' });
    }
};

const getMatch = async (req, res) => {
    try {
        const { id } = req.params;
        const match = await prisma.match.findUnique({
            where: { id },
            include: {
                homeTeam: { include: { players: true } },
                awayTeam: { include: { players: true } },
                playerStats: { include: { player: true } },
                championship: true
            }
        });

        if (!match) return res.status(404).json({ message: 'Match not found' });

        res.json(match);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching match' });
    }
};

const updateMatchResult = async (req, res) => {
    try {
        const { id } = req.params;
        const { homeScore, awayScore, status, events } = req.body;
        // events: array of { playerId, type: 'GOAL'|'ASSIST'|'YELLOW'|'RED'|'SAVE'|'GOAL_CONCEDED' }

        // Update Match Score
        const match = await prisma.match.update({
            where: { id },
            data: {
                homeScore,
                awayScore,
                status: status || 'COMPLETED'
            }
        });

        // Process Player Stats (if provided)
        if (events && Array.isArray(events)) {
            // This is a simplified version. Ideally we should accumulate or recalculate.
            // For now, let's assume we are sending incremental updates or final stats.

            // NOTE: A more robust approach would be to have a MatchEvent model.
            // Here we will update PlayerMatchStat directly.

            for (const event of events) {
                const { playerId, type, value = 1 } = event;

                // Find or create match stat entry for this player
                let matchStat = await prisma.playerMatchStat.findFirst({
                    where: { matchId: id, playerId }
                });

                if (!matchStat) {
                    matchStat = await prisma.playerMatchStat.create({
                        data: { matchId: id, playerId }
                    });
                }

                // Update specific stat
                const updateData = {};
                switch (type) {
                    case 'GOAL': updateData.goals = { increment: value }; break;
                    case 'ASSIST': updateData.assists = { increment: value }; break;
                    case 'YELLOW': updateData.yellowCards = { increment: value }; break;
                    case 'RED': updateData.redCards = { increment: value }; break;
                    case 'SAVE': updateData.saves = { increment: value }; break;
                    case 'GOAL_CONCEDED': updateData.goalsConceded = { increment: value }; break;
                    case 'FOUL': updateData.fouls = { increment: value }; break;
                }

                if (Object.keys(updateData).length > 0) {
                    await prisma.playerMatchStat.update({
                        where: { id: matchStat.id },
                        data: updateData
                    });

                    // Also update Aggregate Player Stats (Career/Season)
                    await prisma.player.update({
                        where: { id: playerId },
                        data: updateData // Luckily the field names match!
                    });
                }
            }
        }

        // Update Team Stats (Wins/Losses) if completed
        if (status === 'COMPLETED' && match.homeTeamId && match.awayTeamId) {
            let homeUpdate = { matchesPlayed: { increment: 1 }, goalsFor: { increment: homeScore }, goalsAgainst: { increment: awayScore } };
            let awayUpdate = { matchesPlayed: { increment: 1 }, goalsFor: { increment: awayScore }, goalsAgainst: { increment: homeScore } };

            if (homeScore > awayScore) {
                homeUpdate.wins = { increment: 1 };
                awayUpdate.losses = { increment: 1 };
            } else if (awayScore > homeScore) {
                homeUpdate.losses = { increment: 1 };
                awayUpdate.wins = { increment: 1 };
            } else {
                homeUpdate.draws = { increment: 1 };
                awayUpdate.draws = { increment: 1 };
            }

            await prisma.team.update({ where: { id: match.homeTeamId }, data: homeUpdate });
            await prisma.team.update({ where: { id: match.awayTeamId }, data: awayUpdate });

            // Trigger Tournament Progression
            if (match.championshipId) {
                await advanceTournamentRound(match.id);
            }
        }

        res.json({ message: 'Match updated successfully', match });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating match' });
    }
};

module.exports = { listMatches, getMatch, updateMatchResult };
