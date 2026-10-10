import { fork, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

function findTsc() {
  try {
    const resolved = require.resolve('typescript/lib/tsc.js');
    if (fs.existsSync(resolved)) return { type: 'fork', path: resolved };
  } catch {}

  const candidates = [
    path.resolve(rootDir, 'node_modules/typescript/lib/tsc.js'),
    path.resolve(rootDir, 'node_modules/.bin/tsc' + (process.platform === 'win32' ? '.cmd' : '')),
    path.resolve(rootDir, 'apps/api/node_modules/typescript/lib/tsc.js')
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return { type: candidate.endsWith('.js') ? 'fork' : 'spawn', path: candidate };
    }
  }

  return { type: 'npx', command: 'tsc' };
}

function runTypecheck(pkgPath, name, tscTool) {
  return new Promise((resolve, reject) => {
    console.log(`\x1b[36m▶ Checking types for ${name}...\x1b[0m`);
    let proc;
    if (tscTool.type === 'fork') {
      proc = fork(tscTool.path, ['--noEmit', '-p', pkgPath], { cwd: pkgPath, stdio: 'inherit' });
    } else if (tscTool.type === 'spawn') {
      proc = spawn(tscTool.path, ['--noEmit', '-p', pkgPath], { cwd: pkgPath, stdio: 'inherit', shell: true });
    } else {
      const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
      proc = spawn(npxCmd, ['tsc', '--noEmit', '-p', pkgPath], { cwd: pkgPath, stdio: 'inherit', shell: true });
    }

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
    const tscTool = findTsc();
    await runTypecheck(path.resolve(rootDir, 'packages/shared'), '@avengercoders/shared', tscTool);
    await runTypecheck(path.resolve(rootDir, 'apps/api'), '@avengercoders/api', tscTool);
    await runTypecheck(path.resolve(rootDir, 'apps/web'), '@avengercoders/web', tscTool);
    console.log('\n\x1b[32m✔ TypeScript typecheck passed with zero errors across all workspaces!\x1b[0m\n');
  } catch (err) {
    console.error('\n\x1b[31m✖ Typecheck failed:\x1b[0m', err.message);
    process.exit(1);
  }
}

typecheckAll();
