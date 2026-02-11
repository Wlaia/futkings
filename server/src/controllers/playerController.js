const prisma = require('../utils/prismaClient');

const createPlayer = async (req, res) => {
    try {
        const { name, number, position, teamId, birthDate, isStarter } = req.body;

        // Authorization Check
        if (req.user.role !== 'ADMIN') {
            const teamCheck = await prisma.team.findUnique({ where: { id: teamId } });
            if (!teamCheck) return res.status(404).json({ message: 'Team not found' });
            if (teamCheck.managerId !== req.user.userId) {
                return res.status(403).json({ message: 'Permission denied: You do not manage this team' });
            }
        }

        const player = await prisma.player.create({
            data: {
                name,
                number: parseInt(number),
                position,
                isStarter: req.body.isStarter === 'true' || req.body.isStarter === true,
                teamId,
                birthDate: birthDate ? new Date(birthDate) : null,
                avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/\s+/g, '')}` // Temporary default avatar
            },
        });

        res.status(201).json(player);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating player' });
    }
};

const listPlayers = async (req, res) => {
    try {
        const { teamId } = req.query;
        const where = teamId ? { teamId } : {};

        const players = await prisma.player.findMany({
            where,
            include: { team: true },
            orderBy: { name: 'asc' }
        });
        res.json(players);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error listing players' });
    }
};

const getPlayer = async (req, res) => {
    try {
        const { id } = req.params;
        const player = await prisma.player.findUnique({
            where: { id },
            include: { team: true, matchStats: true }
        });

        if (!player) return res.status(404).json({ message: 'Player not found' });

        res.json(player);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching player' });
    }
};

const updatePlayer = async (req, res) => {
    try {
        const { id } = req.params;
        const { id: _id, team, matchStats, createdAt, updatedAt, userId, teamId, ...data } = req.body; // Exclude restricted fields

        // Ensure number is int if present
        if (data.number) data.number = parseInt(data.number);

        // Ensure birthDate is Date if present (handle empty string as null)
        if (data.birthDate !== undefined) {
            data.birthDate = data.birthDate ? new Date(data.birthDate) : null;
        }

        // Ensure isStarter is boolean if present
        if (data.isStarter !== undefined) {
            data.isStarter = data.isStarter === 'true' || data.isStarter === true;
        }

        if (req.user.role !== 'ADMIN') {
            const playerCheck = await prisma.player.findUnique({
                where: { id },
                include: { team: true }
            });
            if (!playerCheck) return res.status(404).json({ message: 'Player not found' });

            if (playerCheck.team.managerId !== req.user.userId) {
                return res.status(403).json({ message: 'Permission denied: You do not manage this team' });
            }
        }

        const player = await prisma.player.update({
            where: { id },
            data
        });

        res.json(player);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating player' });
    }
};

const upload = require('../config/uploadConfig');
const { generateAvatarFromPhoto } = require('../services/aiService');
const fs = require('fs');

const updatePlayerAvatar = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const player = await prisma.player.findUnique({ where: { id }, include: { team: true } });
        if (!player) {
            // Clean up if player not found
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ message: 'Player not found' });
        }

        if (req.user.role !== 'ADMIN') {
            if (player.team.managerId !== req.user.userId) {
                fs.unlinkSync(req.file.path); // Clean up uploaded file
                return res.status(403).json({ message: 'Permission denied: You do not manage this team' });
            }
        }

        // Construct Local URL
        // Assuming server serves 'uploads' folder statically at /uploads
        const avatarUrl = `/uploads/${req.file.filename}`;

        // Update Player in DB
        const updatedPlayer = await prisma.player.update({
            where: { id },
            data: { avatarUrl }
        });

        res.json(updatedPlayer);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating avatar' });
    }
};

module.exports = { createPlayer, listPlayers, getPlayer, updatePlayer, updatePlayerAvatar };
