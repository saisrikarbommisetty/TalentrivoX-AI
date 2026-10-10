import { fork } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const viteBin = path.resolve(rootDir, 'node_modules/vite/bin/vite.js');

console.log('\x1b[32m[AvengerCoders Web Dev]\x1b[0m Starting Frontend Web on port 5173...\n');

const webProcess = fork(viteBin, [], {
  cwd: path.resolve(rootDir, 'apps/web'),
  stdio: 'inherit'
});

process.on('SIGINT', () => {
  webProcess.kill();
  process.exit(0);
});
