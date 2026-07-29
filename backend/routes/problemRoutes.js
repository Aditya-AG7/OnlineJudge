const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  getAllProblems,
  getProblemById,
  createProblem,
  updateProblem,
  deleteProblem,
  addTestCase,
} = require('../controllers/problemController');

router.get('/problems', requireAuth, getAllProblems);
router.get('/problems/:id', requireAuth, getProblemById);
router.post('/problems', requireAuth, requireRole('problem_setter', 'admin'), createProblem);
router.put('/problems/:id', requireAuth, requireRole('problem_setter', 'admin'), updateProblem);
router.delete('/problems/:id', requireAuth, requireRole('problem_setter', 'admin'), deleteProblem);
router.post('/problems/:id/testcases', requireAuth, requireRole('problem_setter', 'admin'), addTestCase);

module.exports = router;
