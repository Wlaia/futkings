const express = require('express');
const { listMatches, getMatch, updateMatchResult } = require('../controllers/matchController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticateToken, listMatches);
router.get('/:id', authenticateToken, getMatch);
router.put('/:id', authenticateToken, authorizeRole(['ADMIN']), updateMatchResult);

module.exports = router;
