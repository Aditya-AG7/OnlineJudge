const express = require('express');
const router = express.Router();
const { formatCode } = require('../controllers/formatController');

router.post('/format', formatCode);

module.exports = router;
