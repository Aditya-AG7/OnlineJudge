const test = require('node:test');
const assert = require('node:assert/strict');
const { generateHintWithFallback, classifyError } = require('../services/aiModelManager');
const { MODELS } = require('../config/aiModels');

// Helper to create a mocked GenerativeAI factory
function createMockGenAIFactory(handlerMap) {
  const callHistory = [];

  const factory = (apiKey) => ({
    getGenerativeModel: ({ model }) => ({
      generateContent: async (prompt) => {
        callHistory.push({ model, prompt });
        const handler = handlerMap[model];
        if (!handler) {
          throw new Error(`[404 Not Found] Model ${model} is not configured in test mock`);
        }
        return handler(callHistory.filter(c => c.model === model).length);
      },
    }),
  });

  return { factory, callHistory };
}

test('AI Fallback Suite', async (t) => {
  const fastRetryConfig = {
    maxRetriesPerModel: 1,
    initialBackoffMs: 10, // 10ms for fast test execution
    backoffMultiplier: 1.5,
  };

  await t.test('Scenario 1: Primary model succeeds - no fallback is attempted', async () => {
    const { factory, callHistory } = createMockGenAIFactory({
      'gemini-3.8-flash': () => ({
        response: { text: () => '1. O(N)\n2. O(1)\n3. The current approach is already optimal.' },
      }),
    });

    const result = await generateHintWithFallback({
      prompt: 'Test prompt',
      apiKey: 'test-api-key',
      retryConfig: fastRetryConfig,
      genAIFactory: factory,
    });

    assert.equal(result.model, 'gemini-3.8-flash');
    assert.match(result.hint, /O\(N\)/);
    assert.equal(callHistory.length, 1);
    assert.equal(callHistory[0].model, 'gemini-3.8-flash');
  });

  await t.test('Scenario 2: Primary model returns 503 - retries once, then moves to next model', async () => {
    const { factory, callHistory } = createMockGenAIFactory({
      'gemini-3.8-flash': () => {
        const err = new Error('[503 Service Unavailable] The service is temporarily overloaded');
        err.status = 503;
        throw err;
      },
      'gemini-3.6-flash': () => ({
        response: { text: () => '1. O(N log N)\n2. O(N)\n3. Consider using a hash map.' },
      }),
    });

    const result = await generateHintWithFallback({
      prompt: 'Test prompt',
      apiKey: 'test-api-key',
      retryConfig: fastRetryConfig,
      genAIFactory: factory,
    });

    assert.equal(result.model, 'gemini-3.6-flash');
    assert.match(result.hint, /hash map/);

    // Primary model attempted twice (attempt 1 + 1 retry)
    const primaryAttempts = callHistory.filter(c => c.model === 'gemini-3.8-flash');
    assert.equal(primaryAttempts.length, 2);

    // Secondary model attempted once and succeeded
    const secondaryAttempts = callHistory.filter(c => c.model === 'gemini-3.6-flash');
    assert.equal(secondaryAttempts.length, 1);

    // Tertiary and quaternary should NOT be called
    assert.equal(callHistory.filter(c => c.model === 'gemini-2.5-flash').length, 0);
    assert.equal(callHistory.filter(c => c.model === 'gemini-3.1-flash-lite').length, 0);
  });

  await t.test('Scenario 3: Primary and secondary models fail - tertiary model is attempted', async () => {
    const { factory, callHistory } = createMockGenAIFactory({
      'gemini-3.8-flash': () => {
        const err = new Error('[500 Internal Server Error]');
        err.status = 500;
        throw err;
      },
      'gemini-3.6-flash': () => {
        const err = new Error('[504 Gateway Timeout]');
        err.status = 504;
        throw err;
      },
      'gemini-2.5-flash': () => ({
        response: { text: () => '1. O(1)\n2. O(1)\n3. Solution is optimal.' },
      }),
      'gemini-3.1-flash-lite': () => ({
        response: { text: () => 'Should not be called' },
      }),
    });

    const result = await generateHintWithFallback({
      prompt: 'Test prompt',
      apiKey: 'test-api-key',
      retryConfig: fastRetryConfig,
      genAIFactory: factory,
    });

    assert.equal(result.model, 'gemini-2.5-flash');
    assert.match(result.hint, /Solution is optimal/);

    assert.equal(callHistory.filter(c => c.model === 'gemini-3.8-flash').length, 2);
    assert.equal(callHistory.filter(c => c.model === 'gemini-3.6-flash').length, 2);
    assert.equal(callHistory.filter(c => c.model === 'gemini-2.5-flash').length, 1);
    assert.equal(callHistory.filter(c => c.model === 'gemini-3.1-flash-lite').length, 0);
  });

  await t.test('Scenario 4: Model returns empty response - treated as failed attempt, proceeds to next model', async () => {
    const { factory, callHistory } = createMockGenAIFactory({
      'gemini-3.8-flash': () => ({
        response: { text: () => '   \n   ' }, // Blank/empty response
      }),
      'gemini-3.6-flash': () => ({
        response: { text: () => '1. O(N^2)\n2. O(1)\n3. A two-pointer approach is available.' },
      }),
    });

    const result = await generateHintWithFallback({
      prompt: 'Test prompt',
      apiKey: 'test-api-key',
      retryConfig: fastRetryConfig,
      genAIFactory: factory,
    });

    assert.equal(result.model, 'gemini-3.6-flash');
    assert.match(result.hint, /two-pointer/);
    assert.equal(callHistory[0].model, 'gemini-3.8-flash');
    assert.equal(callHistory[1].model, 'gemini-3.6-flash');
  });

  await t.test('Scenario 5: Model returns 429 - retried once, then falls back to next model', async () => {
    const { factory, callHistory } = createMockGenAIFactory({
      'gemini-3.8-flash': () => {
        const err = new Error('[429 Too Many Requests] RESOURCE_EXHAUSTED');
        err.status = 429;
        throw err;
      },
      'gemini-3.6-flash': () => ({
        response: { text: () => '1. O(log N)\n2. O(1)\n3. Approach is optimal.' },
      }),
    });

    const result = await generateHintWithFallback({
      prompt: 'Test prompt',
      apiKey: 'test-api-key',
      retryConfig: fastRetryConfig,
      genAIFactory: factory,
    });

    assert.equal(result.model, 'gemini-3.6-flash');
    assert.match(result.hint, /Approach is optimal/);
    assert.equal(callHistory.filter(c => c.model === 'gemini-3.8-flash').length, 2);
    assert.equal(callHistory.filter(c => c.model === 'gemini-3.6-flash').length, 1);
  });

  await t.test('Scenario 6: All four models fail - returns a controlled error rather than crashing', async () => {
    const { factory, callHistory } = createMockGenAIFactory({
      'gemini-3.8-flash': () => {
        const err = new Error('[503 Service Unavailable]');
        err.status = 503;
        throw err;
      },
      'gemini-3.6-flash': () => {
        const err = new Error('[500 Internal Error]');
        err.status = 500;
        throw err;
      },
      'gemini-2.5-flash': () => {
        const err = new Error('[404 Not Found] Model is discontinued');
        err.status = 404;
        throw err;
      },
      'gemini-3.1-flash-lite': () => {
        const err = new Error('[503 Service Unavailable]');
        err.status = 503;
        throw err;
      },
    });

    await assert.rejects(
      async () => {
        await generateHintWithFallback({
          prompt: 'Test prompt',
          apiKey: 'test-api-key',
          retryConfig: fastRetryConfig,
          genAIFactory: factory,
        });
      },
      (err) => {
        assert.equal(err.status, 503);
        assert.match(err.message, /All configured AI hint fallback models failed/);
        assert.ok(Array.isArray(err.failures));
        return true;
      }
    );

    // Verify all 4 models were attempted
    const modelsAttempted = new Set(callHistory.map(c => c.model));
    assert.equal(modelsAttempted.size, 4);
    assert.ok(modelsAttempted.has('gemini-3.8-flash'));
    assert.ok(modelsAttempted.has('gemini-3.6-flash'));
    assert.ok(modelsAttempted.has('gemini-2.5-flash'));
    assert.ok(modelsAttempted.has('gemini-3.1-flash-lite'));
  });

  await t.test('Scenario 7: Existing successful response structure preserved', async () => {
    const { factory } = createMockGenAIFactory({
      'gemini-3.8-flash': () => ({
        response: { text: () => '1. Time complexity: O(N)\n2. Space complexity: O(1)\n3. Optimal.' },
      }),
    });

    const result = await generateHintWithFallback({
      prompt: 'Sample code',
      apiKey: 'test-api-key',
      retryConfig: fastRetryConfig,
      genAIFactory: factory,
    });

    // Confirms contract expected by aiController and frontend: { hint: string }
    assert.ok(typeof result.hint === 'string');
    assert.ok(result.hint.length > 0);
  });

  await t.test('Scenario 8: Fatal auth error (401 / API_KEY_INVALID) aborts immediately without trying all models', async () => {
    const { factory, callHistory } = createMockGenAIFactory({
      'gemini-3.8-flash': () => {
        const err = new Error('[400 Bad Request] API key not valid. Please pass a valid API key.');
        err.status = 400;
        throw err;
      },
    });

    await assert.rejects(
      async () => {
        await generateHintWithFallback({
          prompt: 'Test prompt',
          apiKey: 'bad-key',
          retryConfig: fastRetryConfig,
          genAIFactory: factory,
        });
      },
      (err) => {
        const classification = classifyError(err);
        assert.equal(classification.category, 'AUTH_OR_PERMISSION');
        assert.equal(classification.isFatal, true);
        return true;
      }
    );

    // Only 1 attempt made on primary model; did NOT retry and did NOT fallback to secondary models
    assert.equal(callHistory.length, 1);
  });
});
