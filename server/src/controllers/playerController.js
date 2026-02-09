const prisma = require('../utils/prismaClient');

const createPlayer = async (req, res) => {
    try {
        const { name, number, position, teamId, birthDate } = req.body;

        const player = await prisma.player.create({
            data: {
                name,
                number: parseInt(number),
                position,
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

        const player = await prisma.player.findUnique({ where: { id } });
        if (!player) {
            // Clean up if player not found
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ message: 'Player not found' });
        }

        // Construct Local URL
        // Assuming server serves 'uploads' folder statically at /uploads
        const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

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
