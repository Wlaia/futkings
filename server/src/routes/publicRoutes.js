const express = require('express');
const { listChampionships, getChampionship, getChampionshipStandings, getChampionshipStats, listPublicChampionships } = require('../controllers/championshipController');
const { getMatch, getPublicMatches } = require('../controllers/matchController');
const { getTeam } = require('../controllers/teamController');
const { publicAddPlayer, publicUpdatePlayer, publicRemovePlayer } = require('../controllers/publicTeamController');
const { castVote, getVoteResults } = require('../controllers/voteController');
const upload = require('../config/uploadConfig');

const router = express.Router();

// Public Routes - No Authentication Required
router.get('/championships/public-list', listPublicChampionships);
router.get('/championships', listChampionships);
router.get('/championships/:id', getChampionship);
router.get('/matches/public-list', getPublicMatches);
router.get('/matches/:id', getMatch);
router.get('/teams/:id', getTeam);
router.get('/championships/:id/standings', getChampionshipStandings);
router.get('/championships/:id/stats', getChampionshipStats);

// Voting Routes
router.post('/votes', castVote);
router.get('/championships/:id/vote-results', getVoteResults);

// Public Team Mutation Routes (Guarded by DB flags)
router.post('/teams/:id/players', upload.single('avatar'), publicAddPlayer);
router.put('/teams/:id/players/:playerId', upload.single('avatar'), publicUpdatePlayer);
router.delete('/teams/:id/players/:playerId', publicRemovePlayer);

// Health check for DB connection
router.get('/health-db', async (req, res) => {
    try {
        const prisma = require('../utils/prismaClient');
        await prisma.$connect();
        const userCount = await prisma.user.count();
        res.status(200).json({ message: 'Database connection successful', userCount });
    } catch (error) {
        console.error('Database connection failed:', error);
        res.status(500).json({ message: 'Database connection failed', error: error.message });
    }
});

module.exports = router;
