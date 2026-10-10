import { fork } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const vitestBin = path.resolve(rootDir, 'node_modules/vitest/vitest.mjs');

function runVitest(args = ['run']) {
  return new Promise((resolve, reject) => {
    console.log(`\x1b[36m▶ Running Vitest with: ${args.join(' ')}...\x1b[0m`);
    const proc = fork(vitestBin, args, {
      cwd: path.resolve(rootDir, 'apps/api'),
      stdio: 'inherit'
    });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Tests exited with code ${code}`));
    });
    proc.on('error', reject);
  });
}

async function main() {
  try {
    const extraArgs = process.argv.slice(2);
    // Ensure 'run' is always the first command
    const args = ['run', ...extraArgs];
    await runVitest(args);
    console.log('\n\x1b[32m✔ Automated test suite passed successfully!\x1b[0m\n');
  } catch (err) {
    console.error('\n\x1b[31m✖ Tests failed:\x1b[0m', err.message);
    process.exit(1);
  }
}

main();
