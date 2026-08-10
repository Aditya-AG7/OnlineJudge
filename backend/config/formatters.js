const path = require('path');

module.exports = {
  cpp: {
    extension: '.cpp',
    command: (filepath) => `npx --no-install clang-format -style="{BasedOnStyle: Google, IndentWidth: 4}" ${path.resolve(filepath).replace(/\\/g, '/')}`,
  },
  // Future languages get added here, e.g.:
  // python: { extension: '.py', command: (filepath) => `black --quiet - < ${filepath}` },
  // java: { extension: '.java', command: (filepath) => `clang-format -style="{BasedOnStyle: Google, IndentWidth: 4}" ${filepath}` },
};



