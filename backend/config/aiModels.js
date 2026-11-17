// Model configuration for AI Hints in strict priority order
const MODELS = [
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-2.5-flash',
  'gemini-3.1-flash-lite',
];

const RETRY_CONFIG = {
  maxRetriesPerModel: 1, // Number of retries for transient errors per model
  initialBackoffMs: 500,  // Initial delay before retry (ms)
  backoffMultiplier: 2,   // Exponential backoff multiplier
};

module.exports = {
  MODELS,
  RETRY_CONFIG,
};
