const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true,
  },
  input: {
    type: String,
    required: true,
  },
  output: {
    type: String,
    required: true,
  },
  is_sample: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('TestCase', testCaseSchema);
