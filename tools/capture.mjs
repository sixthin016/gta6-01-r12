// Neon Bay — tools/capture.mjs: takes the four staged screenshots.
//
// Serves game/ on a local port, opens each ?shot= URL in headless
// Chromium, waits until the game reports ready AND the photographic
// textures (sky, facades) have loaded, and saves a 1280x720 JPEG into
// screenshots/. Prefers node Playwright when it is installed; falls
// back to a system Chromium binary driven with --headless --screenshot
// and a virtual-time budget, so the tool works on machines without
// Playwright. Usage: node tools/capture.mjs
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const shots = JSON.parse(readFileSync(join(root, 'shots.json'), 'utf8'));
const PORT = Number(process.env.PORT ?? 8091);
const WIDTH = shots.width;
const HEIGHT = shots.height;
// A screenshot under this size is almost certainly a blank frame.
const MIN_JPEG_BYTES = 20000;
// How long the capture waits after the game reports ready before
// taking the screenshot (lets particles and the feed settle).
const SETTLE_MS = 1800;

function serve() {
  return new Promise((resolveServe, rejectServe) => {
    const child = spawn(process.execPath, [join(root, 'serve.ts')], {
      env: { ...process.env, PORT: String(PORT) },
      stdio: 'ignore',
    });
    child.on('error', rejectServe);
    setTimeout(() => resolveServe(child), 1500);
  });
}

// Rewrite a shots.json URL (written for the default :8080 server)
// onto this run's capture port.
function shotUrl(shot) {
  return shot.url.replace('http://localhost:8080', `http://localhost:${PORT}`);
}

// Log one captured shot and sanity-check it: a suspiciously small
// JPEG is almost certainly a blank frame, so fail loudly on it.
function reportShot(shot, bytes, state, pageErrors) {
  const totalErrors = pageErrors.length + state.errors.length;
  console.log(`${shot.file}: ${bytes} bytes, frames=${state.frames} consoleErrors=${totalErrors}`);
  if (bytes < MIN_JPEG_BYTES) throw new Error(`${shot.file} suspiciously small (${bytes} bytes) — likely a blank frame`);
  if (totalErrors) console.warn('  errors:', [...pageErrors, ...state.errors].slice(0, 5));
}

async function captureWithPlaywright() {
  const { chromium } = await import('playwright');
  const server = await serve();
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  try {
    for (const shot of shots.shots) {
      const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
      const errors = [];
      page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
      page.on('pageerror', (err) => errors.push(String(err)));
      await page.goto(shotUrl(shot), { waitUntil: 'load' });
      await page.waitForFunction(
        () => window.__NEONBAY__ && window.__NEONBAY__.ready && window.__NEONBAY__.photoReady,
        null, { timeout: 30000 },
      );
      await page.waitForTimeout(SETTLE_MS);
      const out = join(root, 'screenshots', shot.file);
      await page.screenshot({ path: out, type: 'jpeg', quality: 88 });
      const bytes = statSync(out).size;
      const state = await page.evaluate(() => ({ errors: window.__NEONBAY__.errors, frames: window.__NEONBAY__.frames }));
      reportShot(shot, bytes, state, errors);
      await page.close();
    }
  } finally {
    await browser.close();
    server.kill();
  }
}

function findChromium() {
  const candidates = [
    process.env.CHROME_BIN,
    '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome',
    ...['chromium-1255', 'chromium-1248'].map((v) => `${process.env.HOME}/.cache/ms-playwright/${v}/chrome-linux64/chrome`),
  ].filter(Boolean);
  return candidates.find((p) => existsSync(p)) ?? null;
}

// Fallback: one headless Chromium run per shot with a virtual-time
// budget (no Playwright needed, no error capture — the JPEG size is
// the only sanity check here).
async function captureWithChromeBinary() {
  const chrome = findChromium();
  if (!chrome) throw new Error('no Chromium binary found (set CHROME_BIN)');
  const server = await serve();
  try {
    for (const shot of shots.shots) {
      const out = join(root, 'screenshots', shot.file);
      await new Promise((resolveRun, rejectRun) => {
        const child = spawn(chrome, [
          '--headless=new', '--no-sandbox', '--disable-gpu-sandbox',
          '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
          `--window-size=${WIDTH},${HEIGHT}`,
          '--virtual-time-budget=12000',
          `--screenshot=${out}`,
          shotUrl(shot),
        ], { stdio: 'ignore' });
        child.on('error', rejectRun);
        child.on('close', (code) => (code === 0 ? resolveRun() : rejectRun(new Error(`chromium exited ${code}`))));
      });
      console.log(`${shot.file}: captured via system Chromium`);
    }
  } finally {
    server.kill();
  }
}

async function main() {
  try {
    await captureWithPlaywright();
  } catch (err) {
    console.warn(`Playwright route unavailable (${err.message}); falling back to system Chromium.`);
    await captureWithChromeBinary();
  }
  console.log('Neon Bay: screenshots done.');
}

main().catch((err) => { console.error(err); process.exit(1); });
