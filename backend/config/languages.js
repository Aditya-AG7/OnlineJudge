const pyCmd = process.platform === 'win32' ? 'python' : 'python3';

module.exports = {
  cpp: {
    name: 'C++',
    extension: '.cpp',
    compile: (filepath, outPath) => `g++ ${filepath} -o ${outPath}`,
    run: (outPath) => outPath,
    timeoutOffsetMs: 0,
  },
  c: {
    name: 'C',
    extension: '.c',
    compile: (filepath, outPath) => `gcc ${filepath} -o ${outPath}`,
    run: (outPath) => outPath,
    timeoutOffsetMs: 0,
  },
  java: {
    name: 'Java',
    extension: '.java',
    compile: (filepath, dir) => `javac ${filepath} -d ${dir}`,
    run: (dir) => `java -cp ${dir} Main`,
    fixedFilename: 'Main.java',
    // JVM cold-start (classloading + JIT warmup) adds 150-400ms before user code begins.
    // We add a +1000ms offset allowance to Java timeouts so JVM startup doesn't cause false TLEs.
    timeoutOffsetMs: 1000,
  },
  python: {
    name: 'Python',
    extension: '.py',
    // Pre-flight syntax check via py_compile before running any test cases
    compile: (filepath) => `${pyCmd} -m py_compile ${filepath}`,
    run: (filepath) => `${pyCmd} ${filepath}`,
    timeoutOffsetMs: 0,
  },
  js: {
    name: 'JavaScript',
    extension: '.js',
    // Pre-flight syntax check via node --check before running any test cases
    compile: (filepath) => `node --check ${filepath}`,
    run: (filepath) => `node ${filepath}`,
    timeoutOffsetMs: 0,
  },
};
