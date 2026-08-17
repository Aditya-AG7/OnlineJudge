const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec, spawn } = require('child_process');
const languages = require('../config/languages');

function compileCode(command) {
  return new Promise((resolve) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        return resolve({
          success: false,
          compileError: stderr || err.message || 'Compilation error',
        });
      }
      return resolve({ success: true });
    });
  });
}

function runExecutable(runCommand, inputData = '', timeoutMs = 5000, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    const parts = runCommand.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);

    const child = spawn(cmd, args, { cwd });

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
        return resolve({ status: 'TimeLimitExceeded', output: stdout, stderr, code: null });
      }
      if (code === 0) {
        return resolve({ status: 'Success', output: stdout, stderr, code: 0 });
      } else {
        return resolve({ status: 'RuntimeError', output: stdout, stderr, code });
      }
    });

    if (inputData) {
      child.stdin.write(inputData);
    }
    child.stdin.end();
  });
}

// POST /run
async function runCode(req, res) {
  try {
    const { source_code, input, language } = req.body;

    if (!source_code || typeof source_code !== 'string') {
      return res.status(400).json({ error: 'source_code is required' });
    }

    if (!language || !languages[language]) {
      return res.status(400).json({ error: `Unsupported language: ${language}` });
    }

    const langConfig = languages[language];
    const inputData = typeof input === 'string' ? input : '';

    const tmpDir = path.join(__dirname, '../tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const fileId = crypto.randomUUID();
    const jobDir = path.join(tmpDir, fileId);
    fs.mkdirSync(jobDir, { recursive: true });

    const fileName = langConfig.fixedFilename || `${fileId}${langConfig.extension}`;
    const sourceFile = path.join(jobDir, fileName);
    const outFile = path.join(jobDir, `${fileId}.out`);

    try {
      // 1. Write source code to temporary file
      fs.writeFileSync(sourceFile, source_code, 'utf8');

      // 2. Compile if language requires compilation
      if (langConfig.compile) {
        const compileArg = langConfig.fixedFilename ? jobDir : outFile;
        const compileCmd = langConfig.compile(sourceFile, compileArg);

        const compileRes = await compileCode(compileCmd);
        if (!compileRes.success) {
          return res.status(200).json({
            status: 'CompileError',
            error: compileRes.compileError,
          });
        }
      }

      // 3. Determine run command
      const runArg = langConfig.fixedFilename
        ? jobDir
        : (langConfig.compile ? outFile : sourceFile);
      const runCmd = langConfig.run(runArg);

      // 4. Run command with 5s execution timeout
      const execResult = await runExecutable(runCmd, inputData, 5000, jobDir);

      if (execResult.status === 'TimeLimitExceeded') {
        return res.status(200).json({ status: 'TimeLimitExceeded' });
      }

      if (execResult.status === 'RuntimeError') {
        return res.status(200).json({
          status: 'RuntimeError',
          output: execResult.output,
          error: execResult.stderr,
        });
      }

      return res.status(200).json({
        status: 'Success',
        output: execResult.output,
        stderr: execResult.stderr,
      });
    } finally {
      // Clean up temporary files/directory
      if (fs.existsSync(jobDir)) {
        try {
          fs.rmSync(jobDir, { recursive: true, force: true });
        } catch (e) {}
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
