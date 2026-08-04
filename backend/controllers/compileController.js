const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { compileCpp, runBinary } = require('../utils/compiler');

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
      const compileRes = await compileCpp(cppFile, outFile);
      if (!compileRes.success) {
        return res.status(200).json({
          status: 'CompileError',
          error: compileRes.compileError,
        });
      }

      // 3. Run compiled binary with 5s execution timeout
      const execResult = await runBinary(outFile, inputData, 5000, tmpDir);

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
