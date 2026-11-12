const fs = require('node:fs');
const path = require('node:path');
let ts;
try { ts = require('typescript'); }
catch { ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript'); }

require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      resolveJsonModule: true,
    },
    fileName: filename,
  });
  module._compile(output.outputText, filename);
};

const testDirectory = path.join(__dirname, '..', 'tests');
for (const filename of fs.readdirSync(testDirectory).filter((name) => name.endsWith('.test.ts')).sort()) {
  require(path.join(testDirectory, filename));
}
