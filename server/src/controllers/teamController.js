const prisma = require('../utils/prismaClient');
const { uploadToSupabase } = require('../services/storageService');

const createTeam = async (req, res) => {
    try {
        const { name, logoUrl, managerId, coachName, directorName } = req.body;

        let finalLogoUrl = logoUrl;
        if (req.file) {
            try {
                finalLogoUrl = await uploadToSupabase(req.file, 'teams');
            } catch (uploadError) {
                console.error('Failed to upload team logo during creation:', uploadError);
            }
        }

        if (managerId) {
            const existingTeam = await prisma.team.findUnique({ where: { managerId } });
            if (existingTeam) {
                return res.status(400).json({ message: 'User already manages a team' });
            }
        }

        const team = await prisma.team.create({
            data: {
                name,
                logoUrl: finalLogoUrl,
                managerId,
                coachName,
                directorName
            },
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
        console.log(`[DEBUG] Update Team ${id} - req.file:`, req.file ? req.file.originalname : 'no file');
        console.log(`[DEBUG] Update Team ${id} - body.logoUrl:`, logoUrl);

        if (req.file) {
            try {
                const uploadedUrl = await uploadToSupabase(req.file, 'teams');
                if (uploadedUrl) {
                    finalLogoUrl = uploadedUrl;
                    console.log(`[DEBUG] Update Team ${id} - Supabase Upload Success: ${finalLogoUrl}`);
                } else {
                    console.warn(`[DEBUG] Update Team ${id} - uploadToSupabase returned null`);
                }
            } catch (uploadError) {
                console.error(`[DEBUG] Update Team ${id} - Failed to upload to Supabase:`, uploadError);
            }
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

        console.log(`[DEBUG] Update Team ${id} - DB Update Success. New logoUrl:`, team.logoUrl);

        res.json(team);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating team' });
    }
};

const deleteTeam = async (req, res) => {
    try {
        const { id } = req.params;

        // Authorization Check: Only ADMIN can delete teams
        // (Middleware should handle this, but double check doesn't hurt if logic changes)
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Permission denied: Only ADMIN can delete teams' });
        }

        // Check if team exists
        const team = await prisma.team.findUnique({ where: { id } });
        if (!team) return res.status(404).json({ message: 'Team not found' });

        // Delete team (Cascade delete should handle players if configured in schema, 
        // otherwise we might need to delete players first. Assuming Prisma schema handles relations or we want hard delete)
        // Ideally, we should delete players first to be safe if cascade isn't set up.
        await prisma.player.deleteMany({ where: { teamId: id } });

        // Remove manager association from team if necessary or just delete the team row
        await prisma.team.delete({ where: { id } });

        res.json({ message: 'Team deleted successfully' });
    } catch (error) {
        console.error("Error deleting team:", error);
        res.status(500).json({ message: 'Error deleting team' });
    }
};

module.exports = { createTeam, listTeams, getTeam, joinChampionship, updateTeam, deleteTeam };
