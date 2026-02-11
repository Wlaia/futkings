const express = require('express');
const {
    createChampionship,
    listChampionships,
    getChampionship,
    addTeamToChampionship,
    generateDraw,
    getChampionshipStats,
    getDashboardData,
    getChampionshipStandings,
    listPublicChampionships,
    deleteChampionship,
    updateChampionshipStatus
} = require('../controllers/championshipController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const upload = require('../config/uploadConfig');

const router = express.Router();

router.get('/dashboard', authenticateToken, getDashboardData); // Must be before /:id
router.get('/public-list', listPublicChampionships);
router.post('/', authenticateToken, authorizeRole(['ADMIN']), upload.single('logo'), createChampionship);
router.get('/', authenticateToken, listChampionships);
router.get('/:id', authenticateToken, getChampionship);
router.get('/:id/standings', authenticateToken, getChampionshipStandings);
router.post('/:id/teams', authenticateToken, authorizeRole(['ADMIN']), addTeamToChampionship);
router.post('/:id/draw', authenticateToken, authorizeRole(['ADMIN']), generateDraw);
router.get('/:id/stats', authenticateToken, getChampionshipStats);
router.delete('/:id', authenticateToken, authorizeRole(['ADMIN']), deleteChampionship);
router.patch('/:id/status', authenticateToken, authorizeRole(['ADMIN']), updateChampionshipStatus);

module.exports = router;
