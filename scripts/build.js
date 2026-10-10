import { fork, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

function findExecutable(packageName, relativePath, binName) {
  // 1. Try require.resolve
  try {
    const resolved = require.resolve(packageName + '/' + relativePath);
    if (fs.existsSync(resolved)) return { type: 'fork', path: resolved };
  } catch {}

  // 2. Try common root and workspace paths
  const candidates = [
    path.resolve(rootDir, 'node_modules', packageName, relativePath),
    path.resolve(rootDir, 'node_modules', '.bin', binName + (process.platform === 'win32' ? '.cmd' : '')),
    path.resolve(rootDir, 'apps/web/node_modules', packageName, relativePath),
    path.resolve(rootDir, 'apps/api/node_modules', packageName, relativePath),
    path.resolve(rootDir, 'packages/shared/node_modules', packageName, relativePath)
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return { type: candidate.endsWith('.js') ? 'fork' : 'spawn', path: candidate };
    }
  }

  // 3. Fallback to npx
  return { type: 'npx', command: binName };
}

function runTool(tool, args, cwd) {
  return new Promise((resolve, reject) => {
    console.log(`\n\x1b[36m▶ Running ${tool.command || path.basename(tool.path)} ${args.join(' ')} in ${path.relative(rootDir, cwd) || '.'}\x1b[0m`);

    let proc;
    if (tool.type === 'fork') {
      proc = fork(tool.path, args, { cwd, stdio: 'inherit' });
    } else if (tool.type === 'spawn') {
      proc = spawn(tool.path, args, { cwd, stdio: 'inherit', shell: true });
    } else {
      // npx fallback
      const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
      proc = spawn(npxCmd, [tool.command, ...args], { cwd, stdio: 'inherit', shell: true });
    }

    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Process exited with code ${code}`));
    });
    proc.on('error', (err) => {
      // If fork/spawn fails, attempt npx fallback
      const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
      const fallback = spawn(npxCmd, [tool.command || 'tsc', ...args], { cwd, stdio: 'inherit', shell: true });
      fallback.on('close', (c) => (c === 0 ? resolve() : reject(new Error(`Process exited with code ${c}`))));
      fallback.on('error', reject);
    });
  });
}

async function buildAll() {
  try {
    console.log('\x1b[32m[AvengerCoders Build Pipeline]\x1b[0m Starting full build...');

    const tscTool = findExecutable('typescript', 'lib/tsc.js', 'tsc');
    const viteTool = findExecutable('vite', 'bin/vite.js', 'vite');

    // 1. Build @avengercoders/shared
    await runTool(tscTool, ['-p', path.resolve(rootDir, 'packages/shared')], path.resolve(rootDir, 'packages/shared'));
    console.log('\x1b[32m✔ packages/shared built successfully\x1b[0m');

    // 2. Build @avengercoders/api
    await runTool(tscTool, ['-p', path.resolve(rootDir, 'apps/api')], path.resolve(rootDir, 'apps/api'));
    console.log('\x1b[32m✔ apps/api built successfully\x1b[0m');

    // 3. Build @avengercoders/web
    await runTool(tscTool, ['-p', path.resolve(rootDir, 'apps/web')], path.resolve(rootDir, 'apps/web'));
    await runTool(viteTool, ['build'], path.resolve(rootDir, 'apps/web'));
    console.log('\x1b[32m✔ apps/web built successfully\x1b[0m');

    console.log('\n\x1b[32m✔ All workspaces built successfully!\x1b[0m\n');
  } catch (err) {
    console.error('\n\x1b[31m✖ Build failed:\x1b[0m', err.message);
    process.exit(1);
  }
}

buildAll();
