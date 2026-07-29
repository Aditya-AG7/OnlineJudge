const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  statement: {
    type: String,
    required: true,
  },
  constraints: {
    type: String,
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Easy',
  },
  tags: {
    type: [String],
    default: [],
  },
  time_limit_ms: {
    type: Number,
    required: true,
    default: 2000,
  },
  memory_limit_kb: {
    type: Number,
    required: true,
    default: 262144,
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  is_deleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.model('Problem', problemSchema);
