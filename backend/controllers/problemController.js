const Problem = require('../models/Problem');
const TestCase = require('../models/TestCase');

// GET /problems
async function getAllProblems(req, res) {
  try {
    const problems = await Problem.find({ is_deleted: false }).select('-statement -constraints');
    return res.status(200).json(problems);
  } catch (err) {
    console.error('getAllProblems error:', err);
    return res.status(500).json({ error: 'Something went wrong fetching problems' });
  }
}

// GET /problems/:id
async function getProblemById(req, res) {
  try {
    const { id } = req.params;
    const problem = await Problem.findOne({ _id: id, is_deleted: false });

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const sampleTestCases = await TestCase.find({ problem: id, is_sample: true });

    return res.status(200).json({
      ...problem.toObject(),
      test_cases: sampleTestCases,
    });
  } catch (err) {
    console.error('getProblemById error:', err);
    return res.status(500).json({ error: 'Something went wrong fetching the problem' });
  }
}

// POST /problems
async function createProblem(req, res) {
  try {
    const { title, statement, constraints, difficulty, tags, time_limit_ms, memory_limit_kb } = req.body;

    if (!title || !statement) {
      return res.status(400).json({ error: 'title and statement are required' });
    }

    const newProblem = await Problem.create({
      title,
      statement,
      constraints,
      difficulty,
      tags,
      time_limit_ms,
      memory_limit_kb,
      created_by: req.user.id,
    });

    return res.status(201).json(newProblem);
  } catch (err) {
    console.error('createProblem error:', err);
    return res.status(500).json({ error: 'Something went wrong creating the problem' });
  }
}

// PUT /problems/:id
async function updateProblem(req, res) {
  try {
    const { id } = req.params;
    const problem = await Problem.findOne({ _id: id, is_deleted: false });

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const isOwner = problem.created_by.toString() === req.user.id;
    const isAdmin = req.user.type === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to update this problem' });
    }

    const { title, statement, constraints, difficulty, tags, time_limit_ms, memory_limit_kb } = req.body;

    if (title !== undefined) problem.title = title;
    if (statement !== undefined) problem.statement = statement;
    if (constraints !== undefined) problem.constraints = constraints;
    if (difficulty !== undefined) problem.difficulty = difficulty;
    if (tags !== undefined) problem.tags = tags;
    if (time_limit_ms !== undefined) problem.time_limit_ms = time_limit_ms;
    if (memory_limit_kb !== undefined) problem.memory_limit_kb = memory_limit_kb;

    const updatedProblem = await problem.save();
    return res.status(200).json(updatedProblem);
  } catch (err) {
    console.error('updateProblem error:', err);
    return res.status(500).json({ error: 'Something went wrong updating the problem' });
  }
}

// DELETE /problems/:id
async function deleteProblem(req, res) {
  try {
    const { id } = req.params;
    const problem = await Problem.findOne({ _id: id, is_deleted: false });

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const isOwner = problem.created_by.toString() === req.user.id;
    const isAdmin = req.user.type === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to delete this problem' });
    }

    problem.is_deleted = true;
    await problem.save();

    return res.status(200).json({ message: 'Problem deleted successfully' });
  } catch (err) {
    console.error('deleteProblem error:', err);
    return res.status(500).json({ error: 'Something went wrong deleting the problem' });
  }
}

// POST /problems/:id/testcases
async function addTestCase(req, res) {
  try {
    const { id } = req.params;
    const { input, output, is_sample } = req.body;

    const problem = await Problem.findOne({ _id: id, is_deleted: false });

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const isOwner = problem.created_by.toString() === req.user.id;
    const isAdmin = req.user.type === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to add test cases to this problem' });
    }

    if (input === undefined || input === null || output === undefined || output === null) {
      return res.status(400).json({ error: 'input and output are required' });
    }

    const newTestCase = await TestCase.create({
      problem: problem._id,
      input,
      output,
      is_sample: Boolean(is_sample),
    });

    return res.status(201).json(newTestCase);
  } catch (err) {
    console.error('addTestCase error:', err);
    return res.status(500).json({ error: 'Something went wrong adding the test case' });
  }
}

module.exports = {
  getAllProblems,
  getProblemById,
  createProblem,
  updateProblem,
  deleteProblem,
  addTestCase,
};
