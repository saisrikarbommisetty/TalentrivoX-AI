import { fork } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const tsxBin = path.resolve(rootDir, 'node_modules/tsx/dist/cli.mjs');

console.log('\x1b[32m[AvengerCoders API Dev]\x1b[0m Starting Backend API on port 4000...\n');

const apiProcess = fork(tsxBin, ['watch', 'src/index.ts'], {
  cwd: path.resolve(rootDir, 'apps/api'),
  stdio: 'inherit'
});

process.on('SIGINT', () => {
  apiProcess.kill();
  process.exit(0);
});
