const prisma = require('../utils/prismaClient');
const crypto = require('crypto');

const castVote = async (req, res) => {
    const { championshipId, teamId } = req.body;

    if (!championshipId || !teamId) {
        return res.status(400).json({ message: 'Championship ID e Team ID são obrigatórios.' });
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Hash IP to protect privacy while still limiting votes
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

    try {
        // Check if vote already exists for this IP and Championship
        const existingVote = await prisma.championVote.findUnique({
            where: {
                championshipId_ipHash: {
                    championshipId,
                    ipHash
                }
            }
        });

        if (existingVote) {
            return res.status(400).json({ message: 'Você já votou neste campeonato!' });
        }

        const vote = await prisma.championVote.create({
            data: {
                championshipId,
                teamId,
                ipHash
            }
        });

        res.status(201).json(vote);
    } catch (error) {
        console.error('Error casting vote:', error);
        res.status(500).json({ message: 'Erro ao registrar voto', error: error.message });
    }
};

const getVoteResults = async (req, res) => {
    const { id: championshipId } = req.params;

    try {
        const votes = await prisma.championVote.groupBy({
            by: ['teamId'],
            where: { championshipId },
            _count: {
                _all: true
            }
        });

        const totalVotes = await prisma.championVote.count({
            where: { championshipId }
        });

        res.status(200).json({
            votes: votes.map(v => ({
                teamId: v.teamId,
                count: v._count._all,
                percentage: totalVotes > 0 ? (v._count._all / totalVotes) * 100 : 0
            })),
            totalVotes
        });
    } catch (error) {
        console.error('Error getting vote results:', error);
        res.status(500).json({ message: 'Erro ao buscar resultados', error: error.message });
    }
};

module.exports = {
    castVote,
    getVoteResults
};
