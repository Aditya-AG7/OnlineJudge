const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Problem = require('../models/Problem');

// POST /ai/hint
async function getHint(req, res) {
  try {
    const { problem_id, source_code } = req.body;

    if (!problem_id || !source_code || typeof source_code !== 'string') {
      return res.status(400).json({ error: 'problem_id and source_code are required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(problem_id)) {
      return res.status(400).json({ error: 'Invalid problem ID.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      return res.status(400).json({ error: 'Gemini API key is missing or not configured.' });
    }

    // Fetch problem statement and constraints ONLY (no hidden test cases are fetched or included)
    const problem = await Problem.findOne({ _id: problem_id, is_deleted: false });

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found.' });
    }

    const prompt = `You are reviewing a competitive programming solution. Given the problem statement and the user's code below, respond with exactly three things:
1. Time complexity (Big O)
2. Space complexity (Big O)
3. One short sentence noting whether there's a more optimal approach available — do NOT explain what that approach is or provide any code. If the current approach is already optimal, say so.

Do not provide corrected code, do not rewrite the solution, do not give step-by-step algorithmic guidance beyond the one-sentence nudge.

Problem Statement:
${problem.statement}

Constraints:
${problem.constraints || 'None specified'}

User's Code:
${source_code}`;

    const genAI = new GoogleGenerativeAI(apiKey.trim());
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const hintText = response.text();

    return res.status(200).json({ hint: hintText });
  } catch (err) {
    console.error('getHint error:', err);

    // Handle rate limiting (429), quota exhaustion, or API key errors gracefully
    const errMessage = err.message || '';
    const isRateLimit = err.status === 429 || errMessage.includes('429') || errMessage.includes('RESOURCE_EXHAUSTED');
    const isApiKeyError = errMessage.includes('API_KEY_INVALID') || errMessage.includes('API key not valid');

    if (isRateLimit) {
      return res.status(429).json({ error: 'Gemini API rate limit exceeded. Please wait a moment and try again.' });
    }

    if (isApiKeyError) {
      return res.status(400).json({ error: 'Invalid Gemini API key provided.' });
    }

    return res.status(500).json({ error: errMessage || 'Failed to generate AI hint. Please try again later.' });
  }
}

module.exports = {
  getHint,
};
