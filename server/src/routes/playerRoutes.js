const express = require('express');
const { createPlayer, listPlayers, getPlayer, updatePlayer, updatePlayerAvatar } = require('../controllers/playerController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const upload = require('../config/uploadConfig');

const router = express.Router();

router.post('/', authenticateToken, authorizeRole(['ADMIN', 'MANAGER']), createPlayer);
router.get('/', authenticateToken, listPlayers);
router.get('/:id', authenticateToken, getPlayer);
router.put('/:id', authenticateToken, authorizeRole(['ADMIN', 'MANAGER']), updatePlayer);

// Avatar Upload Route
router.post('/:id/avatar', authenticateToken, upload.single('photo'), updatePlayerAvatar);

module.exports = router;
