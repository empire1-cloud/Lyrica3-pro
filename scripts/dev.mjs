import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backendPython = path.join(root, 'backend', '.venv', 'bin', 'python');
const backendEnv = path.join(root, 'backend', '.env');
const frontendNodeModules = path.join(root, 'frontend', 'node_modules');

if (!existsSync(backendPython) || !existsSync(backendEnv) || !existsSync(frontendNodeModules)) {
  console.error('Missing local setup. Run `npm run setup` first.');
  process.exit(1);
}

const children = [
  spawn(backendPython, ['-m', 'uvicorn', 'server:app', '--reload', '--port', '8001'], {
    cwd: path.join(root, 'backend'),
    stdio: 'inherit',
  }),
  spawn('yarn', ['start'], {
    cwd: path.join(root, 'frontend'),
    stdio: 'inherit',
  }),
];

let shuttingDown = false;
const stopAll = (signal = 'SIGTERM') => {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
};

for (const child of children) {
  child.on('exit', (code) => {
    if (!shuttingDown && code != null && code !== 0) {
      stopAll();
      process.exit(code);
    }
  });
}

process.on('SIGINT', () => stopAll('SIGINT'));
process.on('SIGTERM', () => stopAll('SIGTERM'));
