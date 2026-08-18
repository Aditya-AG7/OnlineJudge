const path = require('path');

const pyCmd = process.platform === 'win32' ? 'python' : 'python3';

module.exports = {
  cpp: {
    extension: '.cpp',
    command: (filepath) => `npx --no-install clang-format -style="{BasedOnStyle: Google, IndentWidth: 4}" "${path.resolve(filepath).replace(/\\/g, '/')}"`,
  },
  c: {
    extension: '.c',
    command: (filepath) => `npx --no-install clang-format -style="{BasedOnStyle: Google, IndentWidth: 4}" "${path.resolve(filepath).replace(/\\/g, '/')}"`,
  },
  java: {
    extension: '.java',
    command: (filepath) => `npx --no-install clang-format -style="{BasedOnStyle: Google, IndentWidth: 4}" "${path.resolve(filepath).replace(/\\/g, '/')}"`,
  },
  python: {
    extension: '.py',
    command: (filepath) => `${pyCmd} -c "import sys, ast; print(ast.unparse(ast.parse(open(sys.argv[1], 'r', encoding='utf-8').read())))" "${path.resolve(filepath).replace(/\\/g, '/')}"`,
  },
};
