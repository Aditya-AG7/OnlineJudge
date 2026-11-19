const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec, execFile, spawn } = require('child_process');
const languages = require('../config/languages');

/**
 * Safely parse a command string into an executable command and arguments array,
 * preserving quoted substrings.
 */
function parseCommand(cmdStr) {
  if (typeof cmdStr !== 'string') {
    return { cmd: '', args: [] };
  }
  const match = cmdStr.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g);
  if (!match || match.length === 0) {
    return { cmd: cmdStr, args: [] };
  }
  const cmd = match[0].replace(/^["']|["']$/g, '');
  const args = match.slice(1).map((arg) => arg.replace(/^["']|["']$/g, ''));
  return { cmd, args };
}

/**
 * Helper to identify broken-pipe stream errors when a child process closes its pipe or terminates.
 * On Unix/Linux: EPIPE
 * On Windows: EOF (libuv UV_EOF) or ECONNRESET
 * Node stream states: ERR_STREAM_DESTROYED, ERR_STREAM_WRITE_AFTER_END
 */
function isBrokenPipeError(err) {
  if (!err) return false;
  const code = err.code || '';
  return code === 'EPIPE' || code === 'EOF' || code === 'ERR_STREAM_DESTROYED' || code === 'ECONNRESET' || code === 'ERR_STREAM_WRITE_AFTER_END';
}

/**
 * Attaches a safe error listener to child.stdin to handle EPIPE, EOF, and stream closure,
 * writes inputData, and cleanly ends the stream.
 */
function setupStdin(child, inputData, onFatalError) {
  if (!child || !child.stdin) return;

  // 1. Attach error listener BEFORE any write or end operation
  child.stdin.on('error', (err) => {
    // EPIPE (Linux), EOF (Windows), ERR_STREAM_DESTROYED, or ECONNRESET indicate
    // the child process closed its stdin pipe or terminated before consuming all input.
    // This is an expected condition and must not crash the Node.js process.
    if (isBrokenPipeError(err)) {
      return;
    }
    // For other unexpected stream errors, notify the caller
    if (typeof onFatalError === 'function') {
      onFatalError(err);
    }
  });

  // 2. Write inputData if provided
  if (typeof inputData === 'string' && inputData.length > 0) {
    try {
      if (child.stdin.writable && !child.stdin.destroyed) {
        child.stdin.write(inputData, 'utf8', (err) => {
          if (err && !isBrokenPipeError(err)) {
            if (typeof onFatalError === 'function') {
              onFatalError(err);
            }
          }
        });
      }
    } catch (err) {
      if (!isBrokenPipeError(err)) {
        if (typeof onFatalError === 'function') {
          onFatalError(err);
        }
      }
    }
  }

  // 3. End stdin stream
  try {
    if (child.stdin.writable && !child.stdin.destroyed) {
      child.stdin.end();
    }
  } catch (err) {
    if (!isBrokenPipeError(err)) {
      if (typeof onFatalError === 'function') {
        onFatalError(err);
      }
    }
  }
}

/**
 * Compiles a C++ source file to an executable output binary (legacy helper).
 */
function compileCpp(cppFile, outFile) {
  return new Promise((resolve, reject) => {
    execFile('g++', [cppFile, '-o', outFile], (err, stdout, stderr) => {
      if (err) {
        if (err.code === 'ENOENT') {
          return reject(new Error('g++ compiler is not installed or not found in PATH'));
        }
        return resolve({ success: false, compileError: stderr || err.message || 'Compilation error' });
      }
      return resolve({ success: true });
    });
  });
}

/**
 * Runs a compiled binary executable with stdin input and execution timeout (legacy helper).
 */
function runBinary(outFile, inputData = '', timeoutMs = 5000, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    let timer = null;
    let isSettled = false;
    let isTimedOut = false;
    let stdout = '';
    let stderr = '';

    function settle(action, value) {
      if (isSettled) return;
      isSettled = true;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      action(value);
    }

    let child;
    try {
      child = spawn(outFile, [], { cwd });
    } catch (err) {
      return settle(reject, err);
    }

    timer = setTimeout(() => {
      isTimedOut = true;
      try {
        child.kill('SIGKILL');
      } catch (e) {}
    }, timeoutMs);

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (err) => {
      settle(reject, err);
    });

    child.on('close', (code) => {
      if (isTimedOut) {
        return settle(resolve, { status: 'TimeLimitExceeded', output: stdout, stderr: stderr, code: null });
      }
      if (code === 0) {
        return settle(resolve, { status: 'Success', output: stdout, stderr: stderr, code: 0 });
      } else {
        return settle(resolve, { status: 'RuntimeError', output: stdout, stderr: stderr, code: code });
      }
    });

    setupStdin(child, inputData, (err) => {
      settle(reject, err);
    });
  });
}

/**
 * Helper to execute a string compile command.
 */
function compileCommand(cmd, cwd) {
  return new Promise((resolve) => {
    exec(cmd, { cwd }, (err, stdout, stderr) => {
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

/**
 * Helper to run a command line process with timeout, stdin, and parse-error classification.
 */
function runCommand(runCmd, inputData = '', timeoutMs = 5000, cwd = process.cwd(), isParseErrorFn = null) {
  return new Promise((resolve, reject) => {
    let timer = null;
    let isSettled = false;
    let isTimedOut = false;
    let stdout = '';
    let stderr = '';

    function settle(action, value) {
      if (isSettled) return;
      isSettled = true;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      action(value);
    }

    const { cmd, args } = parseCommand(runCmd);

    let child;
    try {
      child = spawn(cmd, args, { cwd });
    } catch (err) {
      return settle(reject, err);
    }

    timer = setTimeout(() => {
      isTimedOut = true;
      try {
        child.kill('SIGKILL');
      } catch (e) {}
    }, timeoutMs);

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (err) => {
      settle(reject, err);
    });

    child.on('close', (code) => {
      if (isTimedOut) {
        return settle(resolve, { status: 'TimeLimitExceeded', output: stdout, stderr: stderr, code: null });
      }
      if (code === 0) {
        return settle(resolve, { status: 'Success', output: stdout, stderr: stderr, code: 0 });
      } else {
        if (isParseErrorFn && isParseErrorFn(stderr)) {
          return settle(resolve, { status: 'CompileError', compileError: stderr, output: stdout, stderr: stderr, code: code });
        }
        return settle(resolve, { status: 'RuntimeError', output: stdout, stderr: stderr, code: code });
      }
    });

    setupStdin(child, inputData, (err) => {
      settle(reject, err);
    });
  });
}

module.exports = {
  compileCpp,
  runBinary,
  compileCommand,
  runCommand,
};
