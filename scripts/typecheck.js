import { fork } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const tscBin = path.resolve(rootDir, 'node_modules/typescript/lib/tsc.js');

function runTypecheck(pkgPath, name) {
  return new Promise((resolve, reject) => {
    console.log(`\x1b[36m▶ Checking types for ${name}...\x1b[0m`);
    const proc = fork(tscBin, ['--noEmit', '-p', pkgPath], { cwd: pkgPath, stdio: 'inherit' });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Typecheck failed for ${name}`));
    });
    proc.on('error', reject);
  });
}

async function typecheckAll() {
  try {
    console.log('\x1b[32m[AvengerCoders Typecheck]\x1b[0m Checking TypeScript across all workspaces...');
    await runTypecheck(path.resolve(rootDir, 'packages/shared'), '@avengercoders/shared');
    await runTypecheck(path.resolve(rootDir, 'apps/api'), '@avengercoders/api');
    await runTypecheck(path.resolve(rootDir, 'apps/web'), '@avengercoders/web');
    console.log('\n\x1b[32m✔ TypeScript typecheck passed with zero errors across all workspaces!\x1b[0m\n');
  } catch (err) {
    console.error('\n\x1b[31m✖ Typecheck failed:\x1b[0m', err.message);
    process.exit(1);
  }
}

typecheckAll();
