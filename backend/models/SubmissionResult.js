const mongoose = require('mongoose');

const submissionResultSchema = new mongoose.Schema({
  submission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission',
    required: true,
  },
  testcase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestCase',
    required: true,
  },
  verdict: {
    type: String,
    enum: ['Passed', 'Failed', 'TimeLimitExceeded', 'RuntimeError'],
    required: true,
  },
  stderr: {
    type: String,
  },
  exec_time_ms: {
    type: Number,
  },
});

module.exports = mongoose.model('SubmissionResult', submissionResultSchema);
