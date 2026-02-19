const express = require('express');
const { listMatches, getMatch, updateMatchResult } = require('../controllers/matchController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/public-list', require('../controllers/matchController').getPublicMatches);
router.get('/', authenticateToken, listMatches);
router.get('/:id', authenticateToken, getMatch);
router.post('/', authenticateToken, require('../controllers/matchController').createMatch);
router.put('/:id', authenticateToken, authorizeRole(['ADMIN']), updateMatchResult);

module.exports = router;
