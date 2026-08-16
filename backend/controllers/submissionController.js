const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');

const Submission = require('../models/Submission');
const SubmissionResult = require('../models/SubmissionResult');
const Problem = require('../models/Problem');
const TestCase = require('../models/TestCase');
const { compileCpp, runBinary } = require('../utils/compiler');

// POST /submissions
async function createSubmission(req, res) {
  const tmpDir = path.join(__dirname, '../tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  const fileId = crypto.randomUUID();
  const cppFile = path.join(tmpDir, `${fileId}.cpp`);
  const outFile = path.join(tmpDir, `${fileId}.out`);

  try {
    const problemId = req.body.problem_id || req.body.problem;
    const { source_code } = req.body;

    if (!problemId || !source_code || typeof source_code !== 'string') {
      return res.status(400).json({ error: 'problem_id and source_code are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(problemId)) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const problem = await Problem.findOne({ _id: problemId, is_deleted: false });
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const testCases = await TestCase.find({ problem: problemId }).sort({ createdAt: 1, _id: 1 });

    // 1. Write source code to temporary .cpp file
    fs.writeFileSync(cppFile, source_code, 'utf8');

    // 2. Compile source code
    const compileRes = await compileCpp(cppFile, outFile);

    if (!compileRes.success) {
      const submission = await Submission.create({
        user: req.user.id,
        problem: problemId,
        source_code,
        status: 'CompileError',
        exec_time_ms: 0,
      });

      return res.status(201).json({
        ...submission.toObject(),
        results: [],
      });
    }

    // 3. Create initial Submission record
    const submission = await Submission.create({
      user: req.user.id,
      problem: problemId,
      source_code,
      status: 'Pending',
    });

    const results = [];
    let firstFailureVerdict = null;
    let maxExecTime = 0;

    // 4. Run compiled binary against test cases sequentially (early exit on first failure)
    for (const tc of testCases) {
      const start = Date.now();
      const execRes = await runBinary(outFile, tc.input || '', problem.time_limit_ms || 2000, tmpDir);
      const execTime = Date.now() - start;

      if (execTime > maxExecTime) {
        maxExecTime = execTime;
      }

      let verdict;
      if (execRes.status === 'TimeLimitExceeded') {
        verdict = 'TimeLimitExceeded';
      } else if (execRes.status === 'RuntimeError') {
        verdict = 'RuntimeError';
      } else {
        // Trim trailing whitespace and newlines before comparing
        const actualOutput = (execRes.output || '').replace(/\s+$/, '');
        const expectedOutput = (tc.output || '').replace(/\s+$/, '');

        if (actualOutput === expectedOutput) {
          verdict = 'Passed';
        } else {
          verdict = 'Failed';
        }
      }

      const resultDoc = await SubmissionResult.create({
        submission: submission._id,
        testcase: tc._id,
        verdict,
        stderr: execRes.stderr || '',
        exec_time_ms: execTime,
      });

      results.push(resultDoc);

      if (verdict !== 'Passed') {
        firstFailureVerdict = verdict;
        break;
      }
    }

    // 5. Determine overall Submission status
    let overallStatus = 'Accepted';
    if (firstFailureVerdict) {
      if (firstFailureVerdict === 'Failed') {
        overallStatus = 'WrongAnswer';
      } else if (firstFailureVerdict === 'TimeLimitExceeded') {
        overallStatus = 'TimeLimitExceeded';
      } else if (firstFailureVerdict === 'RuntimeError') {
        overallStatus = 'RuntimeError';
      }
    }

    submission.status = overallStatus;
    submission.exec_time_ms = maxExecTime;
    await submission.save();

    return res.status(201).json({
      ...submission.toObject(),
      total_test_cases: testCases.length,
      results,
    });
  } catch (err) {
    console.error('createSubmission error:', err);
    return res.status(500).json({ error: err.message || 'Something went wrong creating submission' });
  } finally {
    // Clean up temporary files
    if (fs.existsSync(cppFile)) {
      try { fs.unlinkSync(cppFile); } catch (e) {}
    }
    if (fs.existsSync(outFile)) {
      try { fs.unlinkSync(outFile); } catch (e) {}
    }
  }
}

// GET /submissions/:id
async function getSubmissionById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submission = await Submission.findById(id)
      .populate('problem', 'title difficulty tags time_limit_ms memory_limit_kb')
      .populate('user', 'username full_name');

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const isOwner = submission.user._id.toString() === req.user.id || submission.user.toString() === req.user.id;
    const isAdmin = req.user.type === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to view this submission' });
    }

    const results = await SubmissionResult.find({ submission: id }).populate('testcase');

    const safeResults = results.map((r) => {
      const obj = r.toObject();
      if (obj.testcase) {
        if (obj.testcase.is_sample) {
          obj.testcase = {
            _id: obj.testcase._id,
            input: obj.testcase.input,
            output: obj.testcase.output,
            is_sample: true,
          };
        } else {
          // Never expose hidden test case input/output
          obj.testcase = {
            _id: obj.testcase._id,
            is_sample: false,
          };
        }
      }
      return obj;
    });

    const totalTestCases = await TestCase.countDocuments({ problem: submission.problem._id || submission.problem });

    return res.status(200).json({
      ...submission.toObject(),
      total_test_cases: totalTestCases,
      results: safeResults,
    });
  } catch (err) {
    console.error('getSubmissionById error:', err);
    return res.status(500).json({ error: 'Something went wrong fetching the submission' });
  }
}

// GET /submissions
async function getSubmissions(req, res) {
  try {
    const query = {};

    // User scoping logic
    if (req.user.type === 'admin') {
      if (req.query.user_id) {
        query.user = req.query.user_id;
      }
    } else {
      query.user = req.user.id;
    }

    // Problem filter logic
    const problemId = req.query.problem_id || req.query.problem;
    if (problemId) {
      if (mongoose.Types.ObjectId.isValid(problemId)) {
        query.problem = problemId;
      } else {
        return res.status(200).json([]);
      }
    }

    const submissions = await Submission.find(query)
      .select('-source_code')
      .populate('problem', 'title difficulty')
      .populate('user', 'username full_name')
      .sort({ submitted_at: -1 });

    return res.status(200).json(submissions);
  } catch (err) {
    console.error('getSubmissions error:', err);
    return res.status(500).json({ error: 'Something went wrong fetching submissions' });
  }
}

module.exports = {
  createSubmission,
  getSubmissionById,
  getSubmissions,
};
