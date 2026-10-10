import { fork } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const tscBin = path.resolve(rootDir, 'node_modules/typescript/lib/tsc.js');
const viteBin = path.resolve(rootDir, 'node_modules/vite/bin/vite.js');

function runProcess(binary, args, cwd) {
  return new Promise((resolve, reject) => {
    console.log(`\n\x1b[36m▶ Running ${path.basename(binary)} ${args.join(' ')} in ${path.relative(rootDir, cwd) || '.'}\x1b[0m`);
    const proc = fork(binary, args, { cwd, stdio: 'inherit' });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Process exited with code ${code}`));
    });
    proc.on('error', reject);
  });
}

async function buildAll() {
  try {
    console.log('\x1b[32m[AvengerCoders Build Pipeline]\x1b[0m Starting full build...');

    // 1. Build @avengercoders/shared
    await runProcess(tscBin, ['-p', path.resolve(rootDir, 'packages/shared')], path.resolve(rootDir, 'packages/shared'));
    console.log('\x1b[32m✔ packages/shared built successfully\x1b[0m');

    // 2. Build @avengercoders/api
    await runProcess(tscBin, ['-p', path.resolve(rootDir, 'apps/api')], path.resolve(rootDir, 'apps/api'));
    console.log('\x1b[32m✔ apps/api built successfully\x1b[0m');

    // 3. Build @avengercoders/web
    await runProcess(tscBin, ['-p', path.resolve(rootDir, 'apps/web')], path.resolve(rootDir, 'apps/web'));
    await runProcess(viteBin, ['build'], path.resolve(rootDir, 'apps/web'));
    console.log('\x1b[32m✔ apps/web built successfully\x1b[0m');

    console.log('\n\x1b[32m✔ All workspaces built successfully!\x1b[0m\n');
  } catch (err) {
    console.error('\n\x1b[31m✖ Build failed:\x1b[0m', err.message);
    process.exit(1);
  }
}

buildAll();
