const { GoogleGenerativeAI } = require('@google/generative-ai');
const { MODELS, RETRY_CONFIG } = require('../config/aiModels');

/**
 * Classifies an error into transient, model availability, fatal auth/client, or unknown.
 * @param {Error|any} err
 * @returns {object}
 */
function classifyError(err) {
  if (!err) {
    return {
      category: 'UNKNOWN',
      status: 500,
      isTransient: false,
      isFatal: false,
      isModelUnavailable: false,
      description: 'Unknown error',
    };
  }

  let status = typeof err.status === 'number' ? err.status : null;
  const message = String(err.message || '');

  // Parse HTTP status from message if not directly on error object
  if (!status) {
    const statusMatch = message.match(/\[(\d{3})\s+[^\]]*\]/) || message.match(/status[:\s]+(\d{3})/i);
    if (statusMatch) {
      status = parseInt(statusMatch[1], 10);
    }
  }

  // 1. Auth & Permission errors: fatal, switching models or retrying will not resolve this
  const isAuthError =
    status === 401 ||
    status === 403 ||
    message.includes('API_KEY_INVALID') ||
    message.includes('API key not valid') ||
    message.includes('PERMISSION_DENIED');

  if (isAuthError) {
    return {
      category: 'AUTH_OR_PERMISSION',
      status: status || 401,
      isTransient: false,
      isFatal: true,
      isModelUnavailable: false,
      description: 'Authentication failure or invalid API key',
    };
  }

  // 2. Empty or malformed response
  if (message.startsWith('EMPTY_RESPONSE')) {
    return {
      category: 'EMPTY_RESPONSE',
      status: 200,
      isTransient: false,
      isFatal: false,
      isModelUnavailable: false,
      description: 'Model returned an empty or whitespace-only response',
    };
  }

  // 3. Model unavailable or sunset (HTTP 404)
  const isNotFound =
    status === 404 ||
    message.includes('404') ||
    message.toLowerCase().includes('not found') ||
    message.toLowerCase().includes('no longer available');

  if (isNotFound) {
    return {
      category: 'MODEL_UNAVAILABLE',
      status: 404,
      isTransient: false,
      isFatal: false,
      isModelUnavailable: true,
      description: 'Model is not found or is discontinued',
    };
  }

  // 4. Rate limits / Resource exhausted (HTTP 429)
  const isRateLimit = status === 429 || message.includes('429') || message.includes('RESOURCE_EXHAUSTED');
  if (isRateLimit) {
    return {
      category: 'RATE_LIMIT',
      status: 429,
      isTransient: true,
      isFatal: false,
      isModelUnavailable: false,
      description: 'Rate limit or resource quota exhausted',
    };
  }

  // 5. Server errors (500, 502, 503, 504) and Network/Timeout errors
  const is5xx = status === 500 || status === 502 || status === 503 || status === 504;
  const isNetworkOrTimeout =
    err.code === 'ECONNRESET' ||
    err.code === 'ETIMEDOUT' ||
    err.code === 'ENOTFOUND' ||
    err.code === 'ECONNREFUSED' ||
    err.code === 'EAI_AGAIN' ||
    err.name === 'FetchError' ||
    err.name === 'AbortError' ||
    message.toLowerCase().includes('network') ||
    message.toLowerCase().includes('timeout') ||
    message.toLowerCase().includes('socket hang up') ||
    message.toLowerCase().includes('fetch failed');

  if (is5xx || isNetworkOrTimeout) {
    return {
      category: 'SERVER_OR_NETWORK',
      status: status || (isNetworkOrTimeout ? 504 : 503),
      isTransient: true,
      isFatal: false,
      isModelUnavailable: false,
      description: isNetworkOrTimeout ? 'Network error or connection timeout' : `Server error (HTTP ${status})`,
    };
  }

  // 6. Other 400 Bad Request client errors
  if (status === 400) {
    return {
      category: 'INVALID_REQUEST',
      status: 400,
      isTransient: false,
      isFatal: true,
      isModelUnavailable: false,
      description: 'Invalid request payload or arguments',
    };
  }

  return {
    category: 'UNKNOWN',
    status: status || 500,
    isTransient: false,
    isFatal: false,
    isModelUnavailable: false,
    description: message || 'Unknown failure',
  };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes hint generation with sequential multi-model fallback and transient retries.
 *
 * @param {object} options
 * @param {string} options.prompt - Prompt to send to the Gemini model
 * @param {string} options.apiKey - Gemini API key
 * @param {string[]} [options.models] - Optional array of model IDs in priority order
 * @param {object} [options.retryConfig] - Optional retry configuration
 * @param {Function} [options.genAIFactory] - Optional factory for creating GoogleGenerativeAI client (for testing)
 * @returns {Promise<{ hint: string, model: string }>}
 */
async function generateHintWithFallback({
  prompt,
  apiKey,
  models = MODELS,
  retryConfig = RETRY_CONFIG,
  genAIFactory = (key) => new GoogleGenerativeAI(key),
}) {
  const maxRetriesPerModel = retryConfig.maxRetriesPerModel ?? 1;
  const initialBackoffMs = retryConfig.initialBackoffMs ?? 500;
  const backoffMultiplier = retryConfig.backoffMultiplier ?? 2;

  const failureLog = [];

  for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
    const modelId = models[modelIndex];
    const maxAttempts = 1 + maxRetriesPerModel;
    let attempt = 1;

    while (attempt <= maxAttempts) {
      console.log(`[AI Hint] Attempting model: ${modelId} (attempt ${attempt}/${maxAttempts})`);

      try {
        const genAI = genAIFactory(apiKey);
        const model = genAI.getGenerativeModel({ model: modelId });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const hintText = response ? response.text() : '';

        if (!hintText || typeof hintText !== 'string' || !hintText.trim()) {
          throw new Error('EMPTY_RESPONSE: Model returned an empty or blank response');
        }

        console.log(`[AI Hint] Successfully generated hint using model: ${modelId}`);
        return {
          hint: hintText,
          model: modelId,
        };
      } catch (err) {
        const classification = classifyError(err);
        failureLog.push({
          model: modelId,
          attempt,
          category: classification.category,
          status: classification.status,
          description: classification.description,
        });

        // Fatal client/auth errors abort the entire fallback process immediately
        if (classification.isFatal) {
          console.error(`[AI Hint] Fatal error encountered on model ${modelId}: [${classification.category}] ${classification.description}. Aborting fallback.`);
          throw err;
        }

        // Transient errors get retried once on the same model with exponential backoff
        if (classification.isTransient && attempt < maxAttempts) {
          const delayMs = initialBackoffMs * Math.pow(backoffMultiplier, attempt - 1);
          console.warn(`[AI Hint] Model ${modelId} attempt ${attempt} failed with transient error: [HTTP ${classification.status} - ${classification.category}]. Retrying in ${delayMs}ms...`);
          await sleep(delayMs);
          attempt++;
          continue;
        }

        // If not transient, or retries for this model are exhausted:
        const nextModel = models[modelIndex + 1];
        if (nextModel) {
          console.warn(`[AI Hint] Model ${modelId} failed: [${classification.category} - HTTP ${classification.status}]. Switching to fallback model: ${nextModel}`);
        } else {
          console.error(`[AI Hint] Model ${modelId} failed: [${classification.category} - HTTP ${classification.status}]. No more fallback models configured.`);
        }
        break; // Advance to the next model in the outer loop
      }
    }
  }

  console.error('[AI Hint] All configured fallback models exhausted without a successful response.');

  // Check if all models failed specifically due to rate limits
  const allRateLimited = failureLog.length > 0 && failureLog.every((f) => f.category === 'RATE_LIMIT');

  const finalError = new Error('All configured AI hint fallback models failed.');
  finalError.status = allRateLimited ? 429 : 503;
  finalError.category = allRateLimited ? 'RATE_LIMIT' : 'SERVICE_UNAVAILABLE';
  finalError.failures = failureLog;
  throw finalError;
}

module.exports = {
  classifyError,
  generateHintWithFallback,
};
