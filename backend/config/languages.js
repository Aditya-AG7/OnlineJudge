const pyCmd = process.platform === 'win32' ? 'python' : 'python3';

module.exports = {
  cpp: {
    extension: '.cpp',
    compile: (filepath, outPath) => `g++ ${filepath} -o ${outPath}`,
    run: (outPath) => outPath, // executed directly
  },
  c: {
    extension: '.c',
    compile: (filepath, outPath) => `gcc ${filepath} -o ${outPath}`,
    run: (outPath) => outPath,
  },
  java: {
    extension: '.java',
    // Java requires the public class name to match the filename exactly.
    // Use a fixed class name ("Main") and require submissions to define `public class Main`.
    compile: (filepath, dir) => `javac ${filepath} -d ${dir}`,
    run: (dir) => `java -cp ${dir} Main`,
    fixedFilename: 'Main.java', // overrides the random temp filename for this language only
  },
  python: {
    extension: '.py',
    compile: null, // no compile step, interpreted directly
    run: (filepath) => `${pyCmd} ${filepath}`,
  },
};
