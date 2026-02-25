const prisma = require('../utils/prismaClient');
const { uploadToSupabase } = require('../services/storageService');

const createChampionship = async (req, res) => {
    try {
        const { name, type, teamsCount, gameDuration, startDate, endDate, groupsCount, qualifiersPerGroup, rules } = req.body;

        let logoUrl = null;
        if (req.file) {
            try {
                logoUrl = await uploadToSupabase(req.file, 'championships');
            } catch (uploadError) {
                console.error('Failed to upload championship logo:', uploadError);
                return res.status(500).json({ message: 'Erro ao fazer upload da logo da competição.' });
            }
        }

        const championship = await prisma.championship.create({
            data: {
                name,
                type,
                teamsCount: parseInt(teamsCount),
                gameDuration: parseInt(gameDuration),
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                logoUrl,
                groupsCount: groupsCount ? parseInt(groupsCount) : null,
                qualifiersPerGroup: qualifiersPerGroup ? parseInt(qualifiersPerGroup) : null,
                rules: rules ? JSON.parse(rules) : undefined,
                status: 'DRAFT',
            },
        });

        res.status(201).json(championship);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating championship' });
    }
};

const listChampionships = async (req, res) => {
    try {
        const championships = await prisma.championship.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(championships);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error listing championships' });
    }
};

const listPublicChampionships = async (req, res) => {
    try {
        const championships = await prisma.championship.findMany({
            where: {
                status: { in: ['ACTIVE', 'COMPLETED', 'DRAFT'] } // Show all relevant for public
            },
            orderBy: { updatedAt: 'desc' },
            include: {
                teams: {
                    select: { id: true }
                }
            }
        });

        // Transform to include teamsCount based on actual teams or config
        const formatted = championships.map(c => ({
            ...c,
            teamsCount: c.teams.length > 0 ? c.teams.length : c.teamsCount
        }));

        res.json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error listing public championships' });
    }
};

const getChampionship = async (req, res) => {
    try {
        const { id } = req.params;
        const championship = await prisma.championship.findUnique({
            where: { id },
            include: {
                teams: true,
                matches: {
                    include: {
                        homeTeam: true,
                        homeTeam: true,
                        awayTeam: true,
                        // Ensure newly added fields are returned (though findUnique includes all scalar fields by default)
                        // If Prisma client is outdated in memory, it might skip them.

                    },
                    orderBy: { startTime: 'asc' }
                }
            }
        });

        if (!championship) {
            return res.status(404).json({ message: 'Championship not found' });
        }

        res.json(championship);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching championship' });
    }
};

const addTeamToChampionship = async (req, res) => {
    try {
        const { id } = req.params;
        const { teamId } = req.body;

        const team = await prisma.team.update({
            where: { id: teamId },
            data: { championshipId: id }
        });

        res.json(team);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding team' });
    }
};

const generateDraw = async (req, res) => {
    try {
        const { id } = req.params;

        const championship = await prisma.championship.findUnique({
            where: { id },
            include: { teams: true }
        });

        if (!championship || championship.teams.length < 2) {
            return res.status(400).json({ message: 'Not enough teams to draw' });
        }

        // Shuffle teams
        const shuffledTeams = [...championship.teams].sort(() => 0.5 - Math.random());

        const matchesData = [];

        if (championship.type === 'KNOCKOUT_ONLY') {
            // Generate Pairs (Round 1)
            for (let i = 0; i < shuffledTeams.length; i += 2) {
                if (i + 1 < shuffledTeams.length) {
                    matchesData.push({
                        championshipId: id,
                        homeTeamId: shuffledTeams[i].id,
                        awayTeamId: shuffledTeams[i + 1].id,
                        round: 'Round 1',
                        status: 'SCHEDULED'
                    });
                }
            }
        } else if (championship.type === 'GROUPS_KNOCKOUT') {
            // Distribute into Groups (A, B, C, D...)
            const groups = ['Group A', 'Group B', 'Group C', 'Group D'];
            const numGroups = Math.ceil(shuffledTeams.length / 4); // Example: 4 teams per group

            // Assign teams to groups temporarily for match generation
            const groupedTeams = {};
            shuffledTeams.forEach((team, index) => {
                const groupIndex = index % numGroups;
                const groupName = groups[groupIndex];
                if (!groupedTeams[groupName]) groupedTeams[groupName] = [];
                groupedTeams[groupName].push(team);
            });

            // Generate matches for each group (Round Robin)
            Object.keys(groupedTeams).forEach(group => {
                const groupTeams = groupedTeams[group];
                for (let i = 0; i < groupTeams.length; i++) {
                    for (let j = i + 1; j < groupTeams.length; j++) {
                        matchesData.push({
                            championshipId: id,
                            homeTeamId: groupTeams[i].id,
                            awayTeamId: groupTeams[j].id,
                            round: group,
                            status: 'SCHEDULED'
                        });
                    }
                }
            });
        } else if (championship.type === 'LEAGUE_WITH_FINAL') {
            // Round Robin Logic (Todos contra Todos)
            const teams = [...shuffledTeams];
            if (teams.length % 2 !== 0) {
                teams.push(null); // Add dummy team for odd number of teams
            }

            const numRounds = teams.length - 1;
            const halfSize = teams.length / 2;

            for (let round = 0; round < numRounds; round++) {
                for (let i = 0; i < halfSize; i++) {
                    const teamA = teams[i];
                    const teamB = teams[teams.length - 1 - i];

                    if (teamA && teamB) {
                        matchesData.push({
                            championshipId: id,
                            homeTeamId: round % 2 === 0 ? teamA.id : teamB.id, // Swap home/away for balance
                            awayTeamId: round % 2 === 0 ? teamB.id : teamA.id,
                            round: `Rodada ${round + 1}`,
                            status: 'SCHEDULED'
                        });
                    }
                }

                // Rotate teams array (keep first fixed, rotate rest)
                teams.splice(1, 0, teams.pop());
            }
        }

        // Delete existing matches? For now, let's assume clean slate or append.
        // Ideally we should transaction this.

        if (matchesData.length > 0) {
            await prisma.match.createMany({
                data: matchesData
            });

            await prisma.championship.update({
                where: { id },
                data: { status: 'ACTIVE' }
            });
        }

        res.json({ message: 'Draw generated successfully', matchesCount: matchesData.length });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generating draw' });
    }
};

const getChampionshipStats = async (req, res) => {
    try {
        const { id } = req.params;

        // Top Scorers
        const topScorersGroup = await prisma.playerMatchStat.groupBy({
            by: ['playerId'],
            where: {
                match: { championshipId: id }
            },
            _sum: { goals: true },
            orderBy: { _sum: { goals: 'desc' } },
            take: 5
        });

        // Fetch Player Details for Scorers
        const topScorers = await Promise.all(topScorersGroup.map(async (stat) => {
            const player = await prisma.player.findUnique({
                where: { id: stat.playerId },
                include: { team: { select: { name: true, logoUrl: true } } }
            });
            return {
                ...player,
                goals: stat._sum.goals
            };
        }));

        // Top Goalkeepers (Least Conceded)
        // We filter for Goalkeepers who have played at least 1 match ideally, but simplify check matches
        const topGoalkeepersGroup = await prisma.playerMatchStat.groupBy({
            by: ['playerId'],
            where: {
                match: { championshipId: id },
                player: { position: 'GOALKEEPER' }
            },
            _sum: { goalsConceded: true },
            _count: { matchId: true },
            orderBy: { _sum: { goalsConceded: 'asc' } },
            take: 5
        });

        // Fetch Player Details for Goalkeepers
        const topGoalkeepers = await Promise.all(topGoalkeepersGroup.map(async (stat) => {
            const player = await prisma.player.findUnique({
                where: { id: stat.playerId },
                include: { team: { select: { name: true, logoUrl: true } } }
            });
            return {
                ...player,
                goalsConceded: stat._sum.goalsConceded,
                matchesPlayed: stat._count.matchId
            };
        }));

        // Top Assists
        const topAssistsGroup = await prisma.playerMatchStat.groupBy({
            by: ['playerId'],
            where: {
                match: { championshipId: id }
            },
            _sum: { assists: true },
            orderBy: { _sum: { assists: 'desc' } },
            take: 5
        });

        // Fetch Player Details for Assists
        const topAssists = await Promise.all(topAssistsGroup.map(async (stat) => {
            const player = await prisma.player.findUnique({
                where: { id: stat.playerId },
                include: { team: { select: { name: true, logoUrl: true } } }
            });
            return {
                ...player,
                assists: stat._sum.assists
            };
        }));

        res.json({ topScorers, topGoalkeepers, topAssists });

    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ message: 'Error fetching championship stats' });
    }
};

const getDashboardData = async (req, res) => {
    try {
        // Active Championships
        const activeChampionships = await prisma.championship.findMany({
            where: { status: 'ACTIVE' },
            orderBy: { updatedAt: 'desc' },
            take: 10
        });

        // Last Completed Championship with Winner
        let lastChampion = null;
        const lastCompleted = await prisma.championship.findFirst({
            where: { status: 'COMPLETED' },
            orderBy: { updatedAt: 'desc' },
            include: {
                matches: {
                    where: { status: 'COMPLETED' },
                    orderBy: { startTime: 'desc' },
                    include: { homeTeam: true, awayTeam: true }
                }
            }
        });

        if (lastCompleted && lastCompleted.matches.length > 0) {
            // Sort matches to find the "Final" one.
            // Priority:
            // 1. match.round === 'Final'
            // 2. match.startTime (descending), treating null as oldest (0)
            const sortedMatches = lastCompleted.matches.sort((a, b) => {
                if (a.round === 'Final' && b.round !== 'Final') return -1;
                if (b.round === 'Final' && a.round !== 'Final') return 1;

                const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
                const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
                return timeB - timeA;
            });

            const finalMatch = sortedMatches[0];

            if (finalMatch.homeScore > finalMatch.awayScore) {
                lastChampion = { ...finalMatch.homeTeam, championshipName: lastCompleted.name };
            } else if (finalMatch.awayScore > finalMatch.homeScore) {
                lastChampion = { ...finalMatch.awayTeam, championshipName: lastCompleted.name };
            } else {
                // Penalties logic should be here, but for now take home or generic
                lastChampion = { ...finalMatch.homeTeam, championshipName: lastCompleted.name, note: 'Won on penalties (simulated)' };
            }
        }

        res.json({ activeChampionships, lastChampion });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching dashboard data' });
    }
};

const getChampionshipStandings = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch teams and all completed league matches
        const championship = await prisma.championship.findUnique({
            where: { id },
            include: { teams: true }
        });

        if (!championship) return res.status(404).json({ message: 'Championship not found' });

        const leagueMatches = await prisma.match.findMany({
            where: {
                championshipId: id,
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

        // Initialize all teams
        championship.teams.forEach(team => {
            standings[team.id] = {
                id: team.id,
                name: team.name,
                logoUrl: team.logoUrl,
                points: 0,
                matchesPlayed: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                goalDiff: 0,
                yellowCards: 0,
                redCards: 0
            };
        });

        // Calculate Stats
        leagueMatches.forEach(m => {
            const { homeTeamId, awayTeamId, homeScore, awayScore, playerStats } = m;
            if (!homeTeamId || !awayTeamId) return;

            // Update Matches Played
            standings[homeTeamId].matchesPlayed += 1;
            standings[awayTeamId].matchesPlayed += 1;

            // Update Goals
            standings[homeTeamId].goalsFor += homeScore;
            standings[homeTeamId].goalsAgainst += awayScore;
            standings[homeTeamId].goalDiff += (homeScore - awayScore);

            standings[awayTeamId].goalsFor += awayScore;
            standings[awayTeamId].goalsAgainst += homeScore;
            standings[awayTeamId].goalDiff += (awayScore - homeScore);

            // Update Points/W/D/L
            if (homeScore > awayScore) {
                standings[homeTeamId].points += 3;
                standings[homeTeamId].wins += 1;
                standings[awayTeamId].losses += 1;
            } else if (awayScore > homeScore) {
                standings[awayTeamId].points += 3;
                standings[awayTeamId].wins += 1;
                standings[homeTeamId].losses += 1;
            } else {
                // DRAW
                standings[homeTeamId].draws += 1;
                standings[awayTeamId].draws += 1;

                // Check Shootout for extra point
                const homeShootout = m.homeShootoutScore || 0;
                const awayShootout = m.awayShootoutScore || 0;

                if (homeShootout > awayShootout) {
                    standings[homeTeamId].points += 2; // 1 (draw) + 1 (shootout win)
                    standings[awayTeamId].points += 1; // 1 (draw)
                } else if (awayShootout > homeShootout) {
                    standings[awayTeamId].points += 2; // 1 (draw) + 1 (shootout win)
                    standings[homeTeamId].points += 1; // 1 (draw)
                } else {
                    standings[homeTeamId].points += 1;
                    standings[awayTeamId].points += 1;
                }
            }

            // Count Cards
            playerStats.forEach(stat => {
                const teamId = stat.player.teamId;
                if (standings[teamId]) {
                    standings[teamId].yellowCards += (stat.yellowCards || 0);
                    standings[teamId].redCards += (stat.redCards || 0);
                }
            });
        });

        const rankedTeams = Object.values(standings).sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.wins !== a.wins) return b.wins - a.wins;
            if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
            // Tie-break: Red cards (fewer is better), then Yellow cards (fewer is better)
            if (a.redCards !== b.redCards) return a.redCards - b.redCards;
            if (a.yellowCards !== b.yellowCards) return a.yellowCards - b.yellowCards;
            return b.goalsFor - a.goalsFor;
        });

        // Add Rank
        const finalStandings = rankedTeams.map((team, index) => ({
            rank: index + 1,
            ...team
        }));

        res.json(finalStandings);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching standings' });
    }
};

const deleteChampionship = async (req, res) => {
    try {
        const { id } = req.params;

        // Verify if championship exists
        const championship = await prisma.championship.findUnique({
            where: { id },
            include: { matches: true }
        });

        if (!championship) {
            return res.status(404).json({ message: 'Championship not found' });
        }

        // 1. Delete PlayerMatchStats for all matches in this championship
        await prisma.playerMatchStat.deleteMany({
            where: {
                match: {
                    championshipId: id
                }
            }
        });

        // 2. Delete all matches
        await prisma.match.deleteMany({
            where: { championshipId: id }
        });

        // 3. Delete all champion votes
        await prisma.championVote.deleteMany({
            where: { championshipId: id }
        });

        // 4. Dissociate teams
        await prisma.team.updateMany({
            where: { championshipId: id },
            data: { championshipId: null }
        });

        // 5. Finally delete the championship
        await prisma.championship.delete({
            where: { id }
        });

        res.json({ message: 'Campeonato excluído com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting championship' });
    }
};

const updateChampionshipStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const championship = await prisma.championship.update({
            where: { id },
            data: { status }
        });

        res.json(championship);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating status' });
    }
};

module.exports = {
    createChampionship,
    listChampionships,
    listPublicChampionships,
    getChampionship,
    addTeamToChampionship,
    generateDraw,
    getChampionshipStats,
    getDashboardData,
    getChampionshipStandings,
    deleteChampionship,
    updateChampionshipStatus
};
