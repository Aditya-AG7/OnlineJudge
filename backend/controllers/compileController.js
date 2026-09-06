const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const languages = require('../config/languages');
const { compileCommand, runCommand } = require('../utils/compiler');

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

      // 2. Compile if language requires compilation or pre-flight check
      if (langConfig.compile) {
        const compileArg = langConfig.fixedFilename ? jobDir : outFile;
        const compileCmd = langConfig.compile(sourceFile, compileArg);

        const compileRes = await compileCommand(compileCmd, jobDir);
        if (!compileRes.success) {
          return res.status(200).json({
            status: 'CompileError',
            error: compileRes.compileError,
          });
        }
      }

      // 3. Determine run command and timeout
      const isCompiledExecutable = ['cpp', 'c'].includes(language);
      const runArg = langConfig.fixedFilename
        ? jobDir
        : (isCompiledExecutable ? outFile : sourceFile);
      const runCmdStr = langConfig.run(runArg);
      const timeoutMs = 5000 + (langConfig.timeoutOffsetMs || 0);

      // 4. Run command with execution timeout
      const execResult = await runCommand(runCmdStr, inputData, timeoutMs, jobDir, langConfig.isParseError);

      if (execResult.status === 'TimeLimitExceeded') {
        return res.status(200).json({ status: 'TimeLimitExceeded' });
      }

      if (execResult.status === 'CompileError') {
        return res.status(200).json({
          status: 'CompileError',
          error: execResult.compileError || execResult.stderr,
        });
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
      // Clean up temporary job directory
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
