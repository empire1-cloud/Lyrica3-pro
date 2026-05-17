import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backendUrl = process.env.LYRICA_BACKEND_URL || 'http://127.0.0.1:8001';
const frontendUrl = process.env.LYRICA_FRONTEND_URL || 'http://127.0.0.1:3000';
const HEALTH_CHECK_TIMEOUT_MS = 5000;

async function check(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    const data = await response.json().catch(() => null);
    return { ok: response.ok, reachable: true, status: response.status, data };
  } catch (error) {
    return { ok: false, reachable: false, error: error instanceof Error ? error.message : String(error) };
  }
}

const backendHealth = await check(`${backendUrl}/api/health`);
const frontendHealth = await check(frontendUrl);
const checks = [
  {
    label: 'Backend .env',
    ok: existsSync(path.join(root, 'backend', '.env')),
    detail: existsSync(path.join(root, 'backend', '.env')) ? 'present' : 'missing',
  },
  {
    label: 'Frontend .env.local',
    ok: existsSync(path.join(root, 'frontend', '.env.local')),
    detail: existsSync(path.join(root, 'frontend', '.env.local')) ? 'present' : 'missing',
  },
  {
    label: 'Backend API',
    ok: Boolean(backendHealth.reachable),
    detail: backendHealth.reachable ? `${backendHealth.status} ${backendHealth.data?.status || 'ok'}` : backendHealth.error || `HTTP ${backendHealth.status}`,
  },
  {
    label: 'MongoDB via backend health',
    ok: backendHealth.ok && backendHealth.data?.status === 'ok',
    detail: backendHealth.ok ? 'reachable' : backendHealth.data?.detail || 'backend unhealthy',
  },
  {
    label: 'Frontend shell',
    ok: frontendHealth.ok,
    detail: frontendHealth.ok ? `HTTP ${frontendHealth.status}` : frontendHealth.error || `HTTP ${frontendHealth.status}`,
  },
  {
    label: 'Demo mode',
    ok: Boolean(backendHealth.data?.demo_mode),
    detail: backendHealth.data?.demo_mode ? 'enabled' : 'disabled',
  },
];

let failed = false;
for (const item of checks) {
  const prefix = item.ok ? '✅' : '❌';
  if (!item.ok) failed = true;
  console.log(`${prefix} ${item.label}: ${item.detail}`);
}

if (backendHealth.data?.providers) {
  const providers = backendHealth.data.providers;
  console.log(`ℹ️  Providers: llm=${providers.llm ? 'on' : 'fallback'} music=${providers.music ? 'on' : 'fallback'} tts=${providers.tts ? 'on' : 'fallback'}`);
}

process.exit(failed ? 1 : 0);
