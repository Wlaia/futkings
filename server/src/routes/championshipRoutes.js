const express = require('express');
const { createChampionship, listChampionships, getChampionship, addTeamToChampionship, generateDraw, getChampionshipStats, getDashboardData } = require('../controllers/championshipController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const upload = require('../config/uploadConfig');

const router = express.Router();

router.get('/dashboard', authenticateToken, getDashboardData); // Must be before /:id
router.post('/', authenticateToken, authorizeRole(['ADMIN', 'MANAGER']), upload.single('logo'), createChampionship);
router.get('/', authenticateToken, listChampionships);
router.get('/:id', authenticateToken, getChampionship);
router.post('/:id/teams', authenticateToken, authorizeRole(['ADMIN']), addTeamToChampionship);
router.post('/:id/draw', authenticateToken, authorizeRole(['ADMIN']), generateDraw);
router.get('/:id/stats', authenticateToken, getChampionshipStats);

module.exports = router;
