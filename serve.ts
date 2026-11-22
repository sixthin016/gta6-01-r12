// Neon Bay — tiny static server for local play (serve.ts).
// Serves game/ at http://localhost:8080 with no network access of its
// own and no dependencies beyond the Node standard library.
// Run: node serve.ts   (or PORT=8091 node serve.ts)
// then open http://localhost:8080 in desktop Chrome. The game plays
// fully offline: Three.js is vendored under game/vendor/, the sky and
// facade photographs live under game/assets/, and every sound is
// synthesised live with WebAudio.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./game', import.meta.url)));
const port = Number(process.env.PORT ?? 8080);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

function safePath(urlPath) {
  const cleaned = decodeURIComponent(urlPath.split('?')[0]).replace(/\\/g, '/');
  const resolved = resolve(root, '.' + cleaned);
  return resolved.startsWith(root) ? resolved : null;
}

const server = createServer((req, res) => {
  const target = safePath(req.url ?? '/');
  if (!target) {
    res.writeHead(403);
    res.end('forbidden');
    return;
  }
  let file = target;
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file) || statSync(file).isDirectory()) {
    console.warn(`Neon Bay: 404 ${req.url}`);
    res.writeHead(404);
    res.end('not found');
    return;
  }
  // HEAD answers headers only, so the capture tool can probe readiness
  // without downloading the photo textures twice.
  if (req.method === 'HEAD') {
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
    res.end();
    return;
  }
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
});

server.listen(port, () => {
  console.log(`Neon Bay: serving game/ at http://localhost:${port}`);
});
