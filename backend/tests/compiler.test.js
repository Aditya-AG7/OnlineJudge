const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { runCommand, runBinary, compileCommand } = require('../utils/compiler');
const { runCode } = require('../controllers/compileController');
const { createSubmission } = require('../controllers/submissionController');

test('Compiler & Execution Robustness Suite', async (t) => {

  await t.test('Scenario 1: Empty source code is rejected with 400', async () => {
    let statusCode = null;
    let jsonBody = null;
    const req = {
      body: {
        source_code: '',
        language: 'python',
      },
    };
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (body) => {
            jsonBody = body;
          },
        };
      },
    };

    await runCode(req, res);
    assert.equal(statusCode, 400);
    assert.equal(jsonBody.error, 'source_code is required');
  });

  await t.test('Scenario 2: Whitespace-only source code is rejected with 400', async () => {
    let statusCode = null;
    let jsonBody = null;
    const req = {
      body: {
        source_code: '   \n\t  \r\n   ',
        language: 'python',
      },
    };
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (body) => {
            jsonBody = body;
          },
        };
      },
    };

    await runCode(req, res);
    assert.equal(statusCode, 400);
    assert.equal(jsonBody.error, 'source_code is required');
  });

  await t.test('Scenario 3: Valid code with empty stdin executes successfully', async () => {
    const cmd = `node -e "console.log('HELLO_NO_STDIN')"`;
    const result = await runCommand(cmd, '', 3000);

    assert.equal(result.status, 'Success');
    assert.equal(result.code, 0);
    assert.equal(result.output.trim(), 'HELLO_NO_STDIN');
  });

  await t.test('Scenario 4: Valid code with non-empty stdin consumes input correctly', async () => {
    const cmd = `node -e "let d=''; process.stdin.on('data', c => d += c); process.stdin.on('end', () => console.log('ECHO:' + d.trim()));"`;
    const inputData = 'testing standard input string';
    const result = await runCommand(cmd, inputData, 3000);

    assert.equal(result.status, 'Success');
    assert.equal(result.code, 0);
    assert.equal(result.output.trim(), 'ECHO:testing standard input string');
  });

  await t.test('Scenario 5: Program that exits immediately does not crash with EPIPE', async () => {
    const cmd = `node -e "process.exit(0)"`;
    const inputData = 'ignored input data';
    const result = await runCommand(cmd, inputData, 3000);

    assert.equal(result.status, 'Success');
    assert.equal(result.code, 0);
  });

  await t.test('Scenario 6: Program terminates while large input is being written (EPIPE stress test)', async () => {
    // Child immediately exits with code 1 without reading stdin.
    // Parent attempts to write a large payload (1 MB), which forces broken pipe (EPIPE).
    const cmd = `node -e "process.exit(1)"`;
    const hugeInput = 'A'.repeat(1024 * 1024); // 1 MB payload

    // Must NOT throw uncaughtException or unhandled EPIPE error
    const result = await runCommand(cmd, hugeInput, 3000);

    assert.equal(result.status, 'RuntimeError');
    assert.equal(result.code, 1);
  });

  await t.test('Scenario 7: Compilation error is handled cleanly', async () => {
    // Run compileCommand with an intentional syntax error
    const tmpFile = path.join(__dirname, 'temp_syntax_error.js');
    fs.writeFileSync(tmpFile, 'const invalid = ;;;', 'utf8');

    try {
      const compileRes = await compileCommand(`node --check "${tmpFile}"`, __dirname);
      assert.equal(compileRes.success, false);
      assert.ok(compileRes.compileError);
    } finally {
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }
    }
  });

  await t.test('Scenario 8: Runtime errors return RuntimeError status with error code and stderr', async () => {
    const cmd = `node -e "console.error('Fatal crash occurred'); process.exit(17);"`;
    const result = await runCommand(cmd, '', 3000);

    assert.equal(result.status, 'RuntimeError');
    assert.equal(result.code, 17);
    assert.match(result.stderr, /Fatal crash occurred/);
  });

  await t.test('Scenario 9: Execution timeouts trigger TimeLimitExceeded and clean termination', async () => {
    const cmd = `node -e "setInterval(() => {}, 1000);"`;
    const startTime = Date.now();
    const result = await runCommand(cmd, '', 400); // 400ms timeout
    const elapsed = Date.now() - startTime;

    assert.equal(result.status, 'TimeLimitExceeded');
    assert.equal(result.code, null);
    assert.ok(elapsed >= 350 && elapsed < 2000, `Elapsed time ${elapsed}ms was not within expected timeout range`);
  });

  await t.test('Legacy runBinary execution and EPIPE handling', async () => {
    // Test runBinary with binary executable and stdin input
    const binary = process.platform === 'win32' ? 'cmd.exe' : '/bin/sh';
    const exitCmd = process.platform === 'win32' ? 'exit 1\n' : 'exit 1\n';
    const hugeInput = exitCmd + 'Z'.repeat(512 * 1024);

    const result = await runBinary(binary, hugeInput, 3000);
    assert.equal(result.status, 'RuntimeError');
    assert.equal(result.code, 1);
  });
});
