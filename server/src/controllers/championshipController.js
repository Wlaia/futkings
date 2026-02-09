const prisma = require('../utils/prismaClient');

const createChampionship = async (req, res) => {
    try {
        const { name, type, teamsCount, gameDuration, startDate, endDate, groupsCount, qualifiersPerGroup, rules } = req.body;
        const logoUrl = req.file ? `/uploads/${req.file.filename}` : null;

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
                        awayTeam: true
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
            // changes logic: assume the very last match completed determines the winner
            // In a knockout, the last match is the Final.
            const finalMatch = lastCompleted.matches[0];
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

module.exports = { createChampionship, listChampionships, getChampionship, addTeamToChampionship, generateDraw, getChampionshipStats, getDashboardData };
