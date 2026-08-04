const { execFile, spawn } = require('child_process');

/**
 * Compiles a C++ source file to an executable output binary.
 * @param {string} cppFile Absolute path to .cpp file
 * @param {string} outFile Absolute path to output binary
 * @returns {Promise<{ success: boolean, compileError?: string }>}
 */
function compileCpp(cppFile, outFile) {
  return new Promise((resolve, reject) => {
    execFile('g++', [cppFile, '-o', outFile], (err, stdout, stderr) => {
      if (err) {
        // If g++ executable is missing/unreachable at OS level, reject to trigger 500
        if (err.code === 'ENOENT') {
          return reject(new Error('g++ compiler is not installed or not found in PATH'));
        }
        // Compilation error from user C++ code
        return resolve({ success: false, compileError: stderr || err.message || 'Compilation error' });
      }
      return resolve({ success: true });
    });
  });
}

/**
 * Runs a compiled binary executable with stdin input and execution timeout.
 * @param {string} outFile Path to compiled output binary
 * @param {string} inputData String input to write to stdin
 * @param {number} timeoutMs Execution timeout in milliseconds (default 5000)
 * @param {string} cwd Working directory for execution
 * @returns {Promise<{ status: 'Success' | 'RuntimeError' | 'TimeLimitExceeded', output: string, stderr: string, code: number | null }>}
 */
function runBinary(outFile, inputData = '', timeoutMs = 5000, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    const child = spawn(outFile, [], { cwd });

    let stdout = '';
    let stderr = '';
    let isTimedOut = false;

    const timer = setTimeout(() => {
      isTimedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (isTimedOut) {
        return resolve({ status: 'TimeLimitExceeded', output: stdout, stderr: stderr, code: null });
      }
      if (code === 0) {
        return resolve({ status: 'Success', output: stdout, stderr: stderr, code: 0 });
      } else {
        return resolve({ status: 'RuntimeError', output: stdout, stderr: stderr, code: code });
      }
    });

    if (inputData) {
      child.stdin.write(inputData);
    }
    child.stdin.end();
  });
}

module.exports = {
  compileCpp,
  runBinary,
};
