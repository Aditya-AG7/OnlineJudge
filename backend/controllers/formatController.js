const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const formatters = require('../config/formatters');

const execPromise = util.promisify(exec);

// POST /format
async function formatCode(req, res) {
  try {
    const { source_code, language } = req.body;

    if (!source_code || typeof source_code !== 'string') {
      return res.status(400).json({ error: 'source_code is required' });
    }

    if (!language || !formatters[language]) {
      return res.status(400).json({ error: `Unsupported language: ${language}` });
    }

    const formatter = formatters[language];

    const tmpDir = path.join(__dirname, '../tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const fileId = crypto.randomUUID();
    const tempFile = path.join(tmpDir, `${fileId}${formatter.extension}`);

    try {
      fs.writeFileSync(tempFile, source_code, 'utf8');

      const command = formatter.command(tempFile);
      const { stdout } = await execPromise(command, { timeout: 5000 });

      return res.status(200).json({
        formatted_code: stdout,
      });
    } catch (err) {
      console.error('Format command error:', err);
      const isNotFound = err.code === 127 || 
                         (err.message && err.message.includes('not recognized')) || 
                         (err.message && err.message.includes('ENOENT')) ||
                         (err.message && err.message.includes('command not found'));

      const errorMsg = isNotFound
        ? `Code formatter for '${language}' is not installed on the server.`
        : (err.stderr || err.message || 'Failed to format code');

      return res.status(400).json({ error: errorMsg });
    } finally {
      if (fs.existsSync(tempFile)) {
        try {
          fs.unlinkSync(tempFile);
        } catch (e) {}
      }
    }
  } catch (err) {
    console.error('formatCode error:', err);
    return res.status(500).json({ error: err.message || 'Something went wrong formatting code' });
  }
}

module.exports = {
  formatCode,
};
