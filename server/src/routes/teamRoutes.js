const express = require('express');
const { createTeam, listTeams, getTeam, joinChampionship, updateTeam, deleteTeam } = require('../controllers/teamController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

const upload = require('../config/uploadConfig');

const router = express.Router();

const { createTeamManager } = require('../controllers/managerController');

router.post('/', authenticateToken, authorizeRole(['ADMIN']), createTeam);
router.post('/:teamId/manager', authenticateToken, authorizeRole(['ADMIN']), createTeamManager);
router.get('/', authenticateToken, listTeams);
router.get('/:id', authenticateToken, getTeam);
router.put('/join-championship', authenticateToken, authorizeRole(['ADMIN', 'MANAGER']), joinChampionship);
router.put('/:id', authenticateToken, authorizeRole(['ADMIN', 'MANAGER']), upload.single('logo'), updateTeam);
router.delete('/:id', authenticateToken, authorizeRole(['ADMIN']), deleteTeam);

module.exports = router;
