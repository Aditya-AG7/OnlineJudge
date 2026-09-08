const express = require('express');
const router = express.Router();
const { getHint } = require('../controllers/aiController');
const { requireAuth } = require('../middleware/auth');

router.post('/ai/hint', requireAuth, getHint);

module.exports = router;
