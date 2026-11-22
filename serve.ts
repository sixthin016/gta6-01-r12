// Neon Bay — tiny static server for local play (serve.ts).
//
// Serves game/ at http://localhost:8080 with no network access of its
// own and no dependencies beyond the Node standard library.
//
//   Run:  node serve.ts            (or PORT=8091 node serve.ts)
//   Then: open http://localhost:8080 in desktop Chrome.
//
// The game plays fully offline: Three.js is vendored under
// game/vendor/, the sky and facade photographs live under
// game/assets/, and every sound is synthesised live with WebAudio.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// The directory served, and the port it is served on.
const gameRoot = resolve(fileURLToPath(new URL('./game', import.meta.url)));
const port = Number(process.env.PORT ?? 8080);

// Content types by extension. Unknown extensions fall back to
// application/octet-stream in the handler below.
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

function contentTypeFor(file) {
  return MIME_TYPES[extname(file)] ?? 'application/octet-stream';
}

// Resolve a request path to a file under gameRoot, or null when the
// path escapes the root (directory traversal) — the handler answers
// those with 403 instead of serving anything.
function resolveSafePath(urlPath) {
  const cleaned = decodeURIComponent(urlPath.split('?')[0]).replace(/\\/g, '/');
  const resolved = resolve(gameRoot, '.' + cleaned);
  return resolved.startsWith(gameRoot) ? resolved : null;
}

const server = createServer((req, res) => {
  const target = resolveSafePath(req.url ?? '/');
  if (!target) {
    res.writeHead(403);
    res.end('forbidden');
    return;
  }

  // A directory request serves its index.html.
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
    res.writeHead(200, { 'content-type': contentTypeFor(file) });
    res.end();
    return;
  }
  streamFile(file, res);
});

function streamFile(file, res) {
  res.writeHead(200, { 'content-type': contentTypeFor(file) });
  createReadStream(file).pipe(res);
}

server.listen(port, () => {
  console.log(`Neon Bay: serving game/ at http://localhost:${port}`);
});
