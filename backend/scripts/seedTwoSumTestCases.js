// Run this from your backend folder: node scripts/seedTwoSumTestCases.js
// Requires MONGO_URI to be set in .env, same as the main app.

require('dotenv').config();
const mongoose = require('mongoose');
const Problem = require('../models/Problem');
const TestCase = require('../models/TestCase');

const testCases = [
  // --- Sample test cases (shown to user) ---
  { input: '4 9\n2 7 11 15', output: '0 1', is_sample: true },
  { input: '3 6\n3 2 4', output: '1 2', is_sample: true },
  { input: '2 6\n3 3', output: '0 1', is_sample: true },

  // --- Hidden test cases (used only on Submit) ---
  { input: '5 -3\n-1 -2 -3 -4 0', output: '1 2', is_sample: false },
  { input: '6 0\n5 -5 3 -3 1 -1', output: '0 1', is_sample: false },
  { input: '4 8\n0 4 4 0', output: '1 2', is_sample: false },
  { input: '10 17\n1 2 3 4 5 6 7 8 9 10', output: '7 8', is_sample: false },
  { input: '4 -6\n-1 -2 -3 -4', output: '2 3', is_sample: false },
  { input: '2 1000000000\n500000000 500000000', output: '0 1', is_sample: false },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Adjust this title if your Two Sum problem was created with a different exact title
    const problem = await Problem.findOne({ title: 'Two Sum' });

    if (!problem) {
      console.error('Could not find a problem titled "Two Sum". Check the title in your DB and update this script if it differs.');
      process.exit(1);
    }

    console.log(`Found problem: ${problem.title} (${problem._id})`);

    const docsToInsert = testCases.map(tc => ({
      ...tc,
      problem: problem._id,
    }));

    const inserted = await TestCase.insertMany(docsToInsert);
    console.log(`Inserted ${inserted.length} test cases (3 sample, 6 hidden).`);

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();