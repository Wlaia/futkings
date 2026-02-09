const express = require('express');
const { createTeam, listTeams, getTeam, joinChampionship, updateTeam } = require('../controllers/teamController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

const upload = require('../config/uploadConfig');

const router = express.Router();

router.post('/', authenticateToken, authorizeRole(['ADMIN', 'MANAGER']), createTeam);
router.get('/', authenticateToken, listTeams);
router.get('/:id', authenticateToken, getTeam);
router.put('/join-championship', authenticateToken, authorizeRole(['ADMIN', 'MANAGER']), joinChampionship);
router.put('/:id', authenticateToken, authorizeRole(['ADMIN', 'MANAGER']), upload.single('logo'), updateTeam);

module.exports = router;
