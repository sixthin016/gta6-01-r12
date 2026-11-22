// Neon Bay — seeded random helpers (game/src/rng.js).
// Every random-looking thing in Neon Bay (traffic colours, pedestrian
// outfits, palm lean, neon flicker) comes from one seeded stream, so the
// four staged screenshots render identically on every machine and every
// run. The seed is the city's founding year, 1987 — the year the first
// neon sign went up on Neon Row.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const cityRand = mulberry32(1987);

export function pick(rand, list) {
  return list[Math.floor(rand() * list.length)];
}

export function range(rand, lo, hi) {
  return lo + rand() * (hi - lo);
}

export function rangeInt(rand, lo, hi) {
  return lo + Math.floor(rand() * (hi - lo + 1));
}

// Pick n distinct items from a list without mutating it.
export function sample(rand, list, n) {
  const pool = list.slice();
  const out = [];
  while (out.length < n && pool.length) {
    out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  }
  return out;
}

// Fisher-Yates shuffle with a seeded stream — the same input order
// always shuffles to the same output order.
export function shuffle(rand, list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Weighted pick: items are [value, weight] pairs.
export function weightedPick(rand, items) {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let roll = rand() * total;
  for (const [value, weight] of items) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return items[items.length - 1][0];
}

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function smooth(t) {
  return t * t * (3 - 2 * t);
}

// A tiny deterministic hash for naming things from coordinates, so the
// same street corner always gets the same shop awning colour.
export function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
