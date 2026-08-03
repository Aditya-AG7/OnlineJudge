const fs = require('fs');
const path = require('path');
const { execFile, spawn } = require('child_process');
const crypto = require('crypto');

// POST /run
async function runCode(req, res) {
  try {
    const { source_code, input } = req.body;

    if (!source_code || typeof source_code !== 'string') {
      return res.status(400).json({ error: 'source_code is required' });
    }

    const inputData = typeof input === 'string' ? input : '';

    const tmpDir = path.join(__dirname, '../tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const fileId = crypto.randomUUID();
    const cppFile = path.join(tmpDir, `${fileId}.cpp`);
    const outFile = path.join(tmpDir, `${fileId}.out`);

    try {
      // 1. Write source code to temporary .cpp file
      fs.writeFileSync(cppFile, source_code, 'utf8');

      // 2. Compile using g++
      const compileError = await new Promise((resolve, reject) => {
        execFile('g++', [cppFile, '-o', outFile], (err, stdout, stderr) => {
          if (err) {
            // If g++ executable is missing/unreachable at OS level, reject to return 500
            if (err.code === 'ENOENT') {
              return reject(new Error('g++ compiler is not installed or not found in PATH'));
            }
            // User code compilation error
            return resolve(stderr || err.message || 'Compilation error');
          }
          return resolve(null);
        });
      });

      if (compileError) {
        return res.status(200).json({
          status: 'CompileError',
          error: compileError,
        });
      }

      // 3. Run compiled binary with 5s execution timeout
      const execResult = await new Promise((resolve, reject) => {
        const child = spawn(outFile, [], { cwd: tmpDir });

        let stdout = '';
        let stderr = '';
        let isTimedOut = false;

        const timer = setTimeout(() => {
          isTimedOut = true;
          child.kill('SIGKILL');
        }, 5000);

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
            return resolve({ status: 'TimeLimitExceeded' });
          }
          if (code === 0) {
            return resolve({
              status: 'Success',
              output: stdout,
              stderr: stderr,
            });
          } else {
            return resolve({
              status: 'RuntimeError',
              output: stdout,
              error: stderr,
            });
          }
        });

        if (inputData) {
          child.stdin.write(inputData);
        }
        child.stdin.end();
      });

      if (execResult.status === 'TimeLimitExceeded') {
        return res.status(200).json({ status: 'TimeLimitExceeded' });
      }

      if (execResult.status === 'RuntimeError') {
        return res.status(200).json({
          status: 'RuntimeError',
          output: execResult.output,
          error: execResult.error,
        });
      }

      return res.status(200).json({
        status: 'Success',
        output: execResult.output,
        stderr: execResult.stderr,
      });
    } finally {
      // Clean up temporary files
      if (fs.existsSync(cppFile)) {
        try { fs.unlinkSync(cppFile); } catch (e) {}
      }
      if (fs.existsSync(outFile)) {
        try { fs.unlinkSync(outFile); } catch (e) {}
      }
    }
  } catch (err) {
    console.error('runCode error:', err);
    return res.status(500).json({ error: err.message || 'Something went wrong compiling or executing code' });
  }
}

module.exports = {
  runCode,
};
