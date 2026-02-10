const prisma = require('../utils/prismaClient');

const createTeam = async (req, res) => {
    try {
        const { name, logoUrl, managerId, coachName, directorName } = req.body;

        if (managerId) {
            const existingTeam = await prisma.team.findUnique({ where: { managerId } });
            if (existingTeam) {
                return res.status(400).json({ message: 'User already manages a team' });
            }
        }

        const team = await prisma.team.create({
            data: { name, logoUrl, managerId, coachName, directorName },
        });

        res.status(201).json(team);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating team' });
    }
};

const listTeams = async (req, res) => {
    try {
        const teams = await prisma.team.findMany({
            include: { manager: { select: { name: true, email: true } } }
        });
        res.json(teams);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error listing teams' });
    }
};

const getTeam = async (req, res) => {
    try {
        const { id } = req.params;
        const team = await prisma.team.findUnique({
            where: { id },
            include: {
                manager: { select: { name: true } },
                players: true
            }
        });

        if (!team) return res.status(404).json({ message: 'Team not found' });

        res.json(team);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching team' });
    }
};

const joinChampionship = async (req, res) => {
    try {
        const { teamId, championshipId } = req.body;

        // Authorization Check
        if (req.user.role !== 'ADMIN') {
            const teamCheck = await prisma.team.findUnique({ where: { id: teamId } });
            if (!teamCheck) return res.status(404).json({ message: 'Team not found' });

            if (teamCheck.managerId !== req.user.userId) {
                return res.status(403).json({ message: 'Permission denied: You do not manage this team' });
            }
        }

        const team = await prisma.team.update({
            where: { id: teamId },
            data: { championshipId }
        });

        res.json(team);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error joining championship' });
    }
};

const updateTeam = async (req, res) => {
    try {
        const { id } = req.params;

        // Authorization Check: If not ADMIN, user must be the manager of the team
        if (req.user.role !== 'ADMIN') {
            const teamCheck = await prisma.team.findUnique({ where: { id } });
            if (!teamCheck) return res.status(404).json({ message: 'Team not found' });

            if (teamCheck.managerId !== req.user.userId) {
                return res.status(403).json({ message: 'Permission denied: You do not manage this team' });
            }
        }

        const {
            name, logoUrl, coachName, directorName,
            isPublicLinkActive, publicCanAddPlayer, publicCanEditPlayer,
            publicCanImportPlayer, publicCanPrintPlayer
        } = req.body;

        const parseBool = (val) => {
            if (val === undefined) return undefined;
            return val === 'true' || val === true;
        };

        let finalLogoUrl = logoUrl;
        if (req.file) {
            // If checking for existing file hosting, we assume express serves 'uploads' statically
            // const protocol = req.protocol;
            // const host = req.get('host');
            // finalLogoUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
            // Simpler for now (assuming client handles base URL or relative):
            finalLogoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        }

        const team = await prisma.team.update({
            where: { id },
            data: {
                name,
                logoUrl: finalLogoUrl,
                coachName,
                directorName,
                isPublicLinkActive: parseBool(isPublicLinkActive),
                publicCanAddPlayer: parseBool(publicCanAddPlayer),
                publicCanEditPlayer: parseBool(publicCanEditPlayer),
                publicCanImportPlayer: parseBool(publicCanImportPlayer),
                publicCanPrintPlayer: parseBool(publicCanPrintPlayer),
            }
        });

        res.json(team);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating team' });
    }
};

module.exports = { createTeam, listTeams, getTeam, joinChampionship, updateTeam };
