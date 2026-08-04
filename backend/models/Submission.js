const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true,
  },
  source_code: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'WrongAnswer', 'TimeLimitExceeded', 'RuntimeError', 'CompileError'],
    default: 'Pending',
  },
  exec_time_ms: {
    type: Number,
  },
}, {
  timestamps: { createdAt: 'submitted_at', updatedAt: false },
});

module.exports = mongoose.model('Submission', submissionSchema);
