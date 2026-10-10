import { fork } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const tsxBin = path.resolve(rootDir, 'node_modules/tsx/dist/cli.mjs');
const viteBin = path.resolve(rootDir, 'node_modules/vite/bin/vite.js');

console.log('\x1b[32m[AvengerCoders Dev Server]\x1b[0m Starting Backend API and Frontend Web concurrently...\n');

// Start API server (port 4000)
const apiProcess = fork(tsxBin, ['watch', 'src/index.ts'], {
  cwd: path.resolve(rootDir, 'apps/api'),
  stdio: 'inherit'
});

// Start Web Vite server (port 5173)
const webProcess = fork(viteBin, [], {
  cwd: path.resolve(rootDir, 'apps/web'),
  stdio: 'inherit'
});

function cleanup() {
  console.log('\n\x1b[33mShutting down development servers...\x1b[0m');
  try { apiProcess.kill(); } catch (_) {}
  try { webProcess.kill(); } catch (_) {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
