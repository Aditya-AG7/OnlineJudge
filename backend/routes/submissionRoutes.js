const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  createSubmission,
  getSubmissionById,
  getSubmissions,
} = require('../controllers/submissionController');

router.post('/submissions', requireAuth, createSubmission);
router.get('/submissions/:id', requireAuth, getSubmissionById);
router.get('/submissions', requireAuth, getSubmissions);

module.exports = router;
