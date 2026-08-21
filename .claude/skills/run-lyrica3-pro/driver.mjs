// REPL driver for the Lyrica3-pro frontend (Vite/React).
// Fallback for when the `chromium-cli` skill isn't installed on this
// machine — same command vocabulary (nav/wait-for/screenshot/click/fill/
// press/console), implemented directly on top of Playwright's `chromium`.
// Run against a dev server already listening (see SKILL.md).
import { chromium } from 'playwright';
import * as readline from 'node:readline';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SHOT_DIR = process.env.SCREENSHOT_DIR || '/tmp/shots';
fs.mkdirSync(SHOT_DIR, { recursive: true });

let browser, page;
const consoleErrors = [];

const COMMANDS = {
  async nav(url) {
    if (!browser) {
      browser = await chromium.launch({ args: ['--no-sandbox'] });
      page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
      page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
      page.on('pageerror', err => consoleErrors.push(String(err)));
    }
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
    console.log('nav →', url);
  },

  async 'wait-for'(argLine) {
    if (!page) return console.log('ERROR: nav first');
    const sp = argLine.lastIndexOf(' ');
    const maybeMs = sp === -1 ? NaN : Number(argLine.slice(sp + 1));
    const [sel, timeout] = Number.isFinite(maybeMs) ? [argLine.slice(0, sp), maybeMs] : [argLine, 10_000];
    try { await page.waitForSelector(sel, { timeout }); console.log('found:', sel); }
    catch { console.log('TIMEOUT:', sel); }
  },

  async screenshot(name) {
    if (!page) return console.log('ERROR: nav first');
    const f = path.join(SHOT_DIR, (name || `ss-${Date.now()}`) + '.png');
    await page.screenshot({ path: f, fullPage: true });
    console.log('screenshot:', f);
  },

  async 'screenshot-element'(argLine) {
    if (!page) return console.log('ERROR: nav first');
    const [sel, name] = argLine.split(/\s+/, 2);
    const f = path.join(SHOT_DIR, (name || `ss-${Date.now()}`) + '.png');
    await page.locator(sel).first().screenshot({ path: f });
    console.log('screenshot-element:', f);
  },

  // Playwright's own selector engines (`text=`, `css=`, `:has-text()`) work
  // directly — no separate click-text command needed like the Electron skeleton.
  async click(sel) {
    if (!page) return console.log('ERROR: nav first');
    await page.click(sel, { timeout: 10_000 });
    console.log('click', sel, '→ OK');
  },

  // Splits on the FIRST space only — selectors themselves may contain
  // spaces (e.g. input[placeholder="My creator-owned track"]), so a
  // naive split(/\s+/) breaks the selector apart. Prefer selectors
  // without embedded spaces (nth-of-type, ^= prefix matches) when possible.
  async fill(argLine) {
    if (!page) return console.log('ERROR: nav first');
    const sp = argLine.indexOf(' ');
    const [sel, value] = sp === -1 ? [argLine, ''] : [argLine.slice(0, sp), argLine.slice(sp + 1)];
    await page.fill(sel, value);
    console.log('fill', sel, '→ OK');
  },

  async type(text)  { if (page) await page.keyboard.type(text, { delay: 30 }); },
  async press(key)  { if (page) await page.keyboard.press(key); },

  async console(flag) {
    if (flag === '--errors' || !flag) {
      console.log(consoleErrors.length ? consoleErrors.join('\n---\n') : '(no console errors)');
    }
  },

  async eval(expr) {
    if (!page) return console.log('ERROR: nav first');
    try { console.log(JSON.stringify(await page.evaluate(expr))); }
    catch (e) { console.log('ERROR:', e.message); }
  },

  async text(sel) {
    if (!page) return console.log('ERROR: nav first');
    console.log(await page.evaluate(
      s => (s ? document.querySelector(s) : document.body)?.innerText ?? '(null)',
      sel || null));
  },

  async quit() { if (browser) await browser.close().catch(() => {}); browser = null; page = null; },
  help() { console.log('commands:', Object.keys(COMMANDS).join(', ')); },
};

const stdin = fs.createReadStream(null, { fd: fs.openSync('/dev/stdin', 'r') });
const rl = readline.createInterface({ input: stdin, output: process.stdout, prompt: 'driver> ' });

// Piped heredoc input delivers all lines in one tick — readline's 'line'
// event fires for each before an async handler for the prior one resolves.
// Chain onto a single promise so commands actually run in order.
let queue = Promise.resolve();

rl.on('line', line => {
  queue = queue.then(async () => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const sp = trimmed.indexOf(' ');
    const cmd = sp === -1 ? trimmed : trimmed.slice(0, sp);
    const rest = sp === -1 ? '' : trimmed.slice(sp + 1);
    const fn = COMMANDS[cmd];
    if (!fn) { console.log('unknown:', cmd, '— try: help'); return; }
    try { await fn(rest); } catch (e) { console.log('ERROR:', e.message); }
    if (cmd === 'quit') { rl.close(); process.exit(0); }
  });
});
rl.on('close', async () => { await queue.catch(() => {}); await COMMANDS.quit(); process.exit(0); });

console.log('lyrica3-pro driver — "help" for commands, "nav <url>" to start');
rl.prompt();
