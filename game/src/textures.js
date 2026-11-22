// Neon Bay — textures (game/src/textures.js).
// Two kinds of art live in this game. The photographic kind was made
// outside the program and ships as files: game/assets/sky.jpg (a real
// golden-hour photograph over the bay, 1600x900) and
// game/assets/facades.jpg (a real photograph of art-deco shopfronts —
// Palms Bar, Tiki Lounge, Sunset Cocktails, Gelato — 1400x933). The
// procedural kind below is painted at load time on offscreen canvases:
// asphalt with speckle and lane wear, beach sand with grain, brick with
// mortar, glass towers with lit windows, neon sign strips, palm bark and
// fronds, and the ocean. Together they keep any single frame from ever
// looking like flat coloured boxes — the exact failure the round-6
// diagnosis found in the old build.
import * as THREE from '../vendor/three.module.min.js';
import { mulberry32, range } from './rng.js';

function canvasTexture(w, h, paint, repeatX = 1, repeatY = 1) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  paint(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.anisotropy = 4;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function speckle(ctx, w, h, rand, n, colors, sizeMax = 2) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
    ctx.globalAlpha = 0.25 + rand() * 0.55;
    const s = 0.6 + rand() * sizeMax;
    ctx.fillRect(rand() * w, rand() * h, s, s);
  }
  ctx.globalAlpha = 1;
}

export function makeAsphalt() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const rand = mulberry32(11);
    ctx.fillStyle = '#2e3138'; ctx.fillRect(0, 0, w, h);
    speckle(ctx, w, h, rand, 2600, ['#3a3e46', '#23262c', '#4a4f58', '#17191d']);
    // worn tyre bands
    ctx.globalAlpha = 0.16; ctx.fillStyle = '#101216';
    ctx.fillRect(52, 0, 26, h); ctx.fillRect(178, 0, 26, h);
    ctx.globalAlpha = 1;
    // faint centre dashes painted on the texture itself
    ctx.fillStyle = '#d8c25a';
    ctx.fillRect(124, 8, 8, 44); ctx.fillRect(124, 136, 8, 44);
  }, 6, 6);
}

export function makeSand() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const rand = mulberry32(23);
    ctx.fillStyle = '#e8c98f'; ctx.fillRect(0, 0, w, h);
    speckle(ctx, w, h, rand, 3200, ['#f4dcab', '#d9b478', '#c9a468', '#fff2cf'], 2.4);
    // wind ripples
    ctx.strokeStyle = 'rgba(180,150,100,0.35)'; ctx.lineWidth = 1.4;
    for (let y = 10; y < h; y += 22) {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 16) ctx.lineTo(x, y + Math.sin(x * 0.09 + y) * 3);
      ctx.stroke();
    }
  }, 8, 8);
}

export function makeBrick(base, mortar) {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const rand = mulberry32(37);
    ctx.fillStyle = mortar; ctx.fillRect(0, 0, w, h);
    const bh = 21, bw = 62;
    for (let row = 0; row * bh < h; row++) {
      const off = (row % 2) * (bw / 2);
      for (let col = -1; col * bw < w + bw; col++) {
        const shade = 0.82 + rand() * 0.36;
        ctx.fillStyle = shadeColor(base, shade);
        ctx.fillRect(col * bw + off + 2, row * bh + 2, bw - 4, bh - 4);
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        ctx.fillRect(col * bw + off + 2, row * bh + 2, bw - 4, 3);
      }
    }
  }, 2, 2);
}

export function shadeColor(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * f));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * f));
  const b = Math.min(255, Math.round((n & 255) * f));
  return `rgb(${r},${g},${b})`;
}

// A glass tower face: deep blue glass, mullion grid, and a scatter of
// warm lit windows — at golden hour half the city has its lights on.
export function makeGlassTower() {
  return canvasTexture(256, 512, (ctx, w, h) => {
    const rand = mulberry32(41);
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#2c4a6e'); grad.addColorStop(0.55, '#1d3350');
    grad.addColorStop(1, '#274b74');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    for (let y = 8; y < h - 14; y += 26) {
      for (let x = 8; x < w - 14; x += 30) {
        const lit = rand() < 0.42;
        ctx.fillStyle = lit ? (rand() < 0.7 ? '#ffd98a' : '#ff9e57') : '#16283e';
        ctx.globalAlpha = lit ? 0.95 : 1;
        ctx.fillRect(x, y, 20, 15);
      }
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(10,18,30,0.85)'; ctx.lineWidth = 3;
    for (let x = 0; x <= w; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y <= h; y += 26) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    // sunset reflection band
    const sun = ctx.createLinearGradient(0, 120, 0, 210);
    sun.addColorStop(0, 'rgba(255,170,90,0)'); sun.addColorStop(0.5, 'rgba(255,170,90,0.30)');
    sun.addColorStop(1, 'rgba(255,170,90,0)');
    ctx.fillStyle = sun; ctx.fillRect(0, 120, w, 90);
  }, 1, 1);
}

// Neon sign strip: painted once, reused on shopfronts and the Neon Row
// arch. The letters are drawn as glowing bars and dots, not text, so
// the texture stays crisp at any distance.
export function makeNeonStrip(hueA, hueB) {
  return canvasTexture(512, 64, (ctx, w, h) => {
    const rand = mulberry32(53);
    ctx.fillStyle = '#0b0714'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = hueA; ctx.lineWidth = 5; ctx.shadowColor = hueA; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.moveTo(8, h / 2); ctx.lineTo(w - 8, h / 2); ctx.stroke();
    ctx.strokeStyle = hueB; ctx.lineWidth = 3; ctx.shadowColor = hueB;
    for (let x = 30; x < w - 20; x += 46) {
      ctx.beginPath(); ctx.arc(x, h / 2, 9, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.shadowBlur = 0;
    speckle(ctx, w, h, rand, 120, ['#ffffff', hueA], 1.4);
  }, 1, 1);
}

export function makeWater() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const rand = mulberry32(67);
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#1fa8a0'); grad.addColorStop(0.5, '#0e7d8c');
    grad.addColorStop(1, '#14919b');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 46; i++) {
      const x = rand() * w, y = rand() * h, len = 14 + rand() * 30;
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + len / 2, y + 3, x + len, y);
      ctx.stroke();
    }
    speckle(ctx, w, h, rand, 500, ['#bfeee8', '#0a5a66'], 1.6);
  }, 10, 10);
}

export function makePalmBark() {
  return canvasTexture(64, 256, (ctx, w, h) => {
    const rand = mulberry32(71);
    ctx.fillStyle = '#7a5a38'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(60,40,20,0.7)'; ctx.lineWidth = 3;
    for (let y = 6; y < h; y += 16) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y + 6); ctx.stroke();
    }
    speckle(ctx, w, h, rand, 260, ['#8d6b45', '#5d4126'], 1.8);
  }, 1, 1);
}

// Load the two photographic textures. They resolve asynchronously; the
// world builder falls back to procedural colours until they arrive, and
// the staged shots wait for them (shots.js gates on window.__NEONBAY__
// photoReady) so no screenshot is ever taken with a missing sky.
export function loadPhotos(loader) {
  const out = { sky: null, facades: null, done: false };
  let pending = 2;
  const finish = () => { pending -= 1; if (pending <= 0) out.done = true; };
  loader.load('assets/sky.jpg', (t) => { t.colorSpace = THREE.SRGBColorSpace; out.sky = t; finish(); }, undefined, finish);
  loader.load('assets/facades.jpg', (t) => { t.colorSpace = THREE.SRGBColorSpace; out.facades = t; finish(); }, undefined, finish);
  return out;
}

export function makeCrosswalk() {
  return canvasTexture(256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#2e3138'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f2f2f2';
    for (let x = 8; x < w; x += 32) ctx.fillRect(x, 10, 18, h - 20);
    speckle(ctx, w, h, mulberry32(83), 300, ['#3a3e46', '#23262c'], 1.6);
  }, 1, 1);
}

export function makeSidewalk() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const rand = mulberry32(97);
    ctx.fillStyle = '#b9b3a4'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(90,85,70,0.7)'; ctx.lineWidth = 2;
    for (let x = 0; x <= w; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y <= h; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    speckle(ctx, w, h, rand, 900, ['#c8c2b2', '#a39d8c', '#8f8878'], 1.8);
  }, 4, 4);
}

export function buildTextureSet() {
  return {
    asphalt: makeAsphalt(),
    sand: makeSand(),
    brickCoral: makeBrick('#d96a5f', '#8a4038'),
    brickCream: makeBrick('#e8d9b0', '#a8935f'),
    glass: makeGlassTower(),
    neonPink: makeNeonStrip('#ff4fd8', '#37e6ff'),
    neonAmber: makeNeonStrip('#ffb13d', '#ff4f6d'),
    water: makeWater(),
    bark: makePalmBark(),
    crosswalk: makeCrosswalk(),
    sidewalk: makeSidewalk(),
  };
}
