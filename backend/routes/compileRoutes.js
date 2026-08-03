const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { runCode } = require('../controllers/compileController');

router.post('/run', requireAuth, runCode);

module.exports = router;
