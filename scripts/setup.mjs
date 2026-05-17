import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backendEnvExample = path.join(root, 'backend', '.env.example');
const backendEnv = path.join(root, 'backend', '.env');
const backendVenv = path.join(root, 'backend', '.venv');
const frontendEnv = path.join(root, 'frontend', '.env.local');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', cwd: root, ...options });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!existsSync(backendEnv)) {
  copyFileSync(backendEnvExample, backendEnv);
}

let backendEnvText = readFileSync(backendEnv, 'utf8');
if (!backendEnvText.includes('DEMO_MODE=')) {
  backendEnvText = `${backendEnvText.trimEnd()}\nDEMO_MODE=true\n`;
}
writeFileSync(backendEnv, backendEnvText.replace('MONGO_URL=mongodb://localhost:27017', 'MONGO_URL=mongodb://localhost:27017'));

if (!existsSync(frontendEnv)) {
  writeFileSync(frontendEnv, 'REACT_APP_BACKEND_URL=http://localhost:8001\n');
}

if (!existsSync(backendVenv)) {
  run('python3', ['-m', 'venv', backendVenv]);
}

run(path.join(backendVenv, 'bin', 'python'), ['-m', 'pip', 'install', '--upgrade', 'pip']);
run(path.join(backendVenv, 'bin', 'python'), ['-m', 'pip', 'install', '-r', path.join(root, 'backend', 'requirements.txt')]);
run('yarn', ['install', '--ignore-engines'], { cwd: path.join(root, 'frontend') });

console.log('\nSetup complete. Run `npm run dev` to start the stack.');
