// Neon Bay — seeded randomness (game/src/rng.js).
//
// One rule governs every random-looking thing in Neon Bay — traffic
// paint, pedestrian outfits, palm lean, neon flicker, shop awnings:
// it all comes from a seeded stream, never from Math.random. That is
// what makes the four staged screenshots render identically on every
// machine and every run. The founding seed is 1987, the year the
// first neon sign went up on Neon Row and the year on the Vesper GT's
// plate (NB-1987).
//
// The helpers below fall into four groups:
//   * streams   — mulberry32 + the shared city stream
//   * picking   — pick / range / rangeInt / sample / shuffle / weightedPick
//   * math      — clamp / lerp / smooth (smoothstep)
//   * hashing   — hash2, a deterministic 2-D hash for per-corner variety

// mulberry32: a tiny, fast, deterministic PRNG. `seed` is any integer;
// the returned function yields a float in [0, 1) and is fully
// reproducible for a given seed.
export function mulberry32(seed) {
  let state = seed >>> 0;
  return function next() {
    state |= 0;
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The shared city stream — used wherever a one-off random choice is
// needed without its own stream. Seeded from the founding year.
export const cityRand = mulberry32(1987);

// --- Picking helpers -------------------------------------------------

// One item, uniformly at random, from a non-empty list.
export function pick(rand, list) {
  return list[Math.floor(rand() * list.length)];
}

// A float in [lo, hi).
export function range(rand, lo, hi) {
  return lo + rand() * (hi - lo);
}

// An integer in [lo, hi], inclusive on both ends.
export function rangeInt(rand, lo, hi) {
  return lo + Math.floor(rand() * (hi - lo + 1));
}

// Pick n distinct items from a list without mutating the list.
// Returns fewer than n only when the list itself is shorter.
export function sample(rand, list, n) {
  const pool = list.slice();
  const drawn = [];
  while (drawn.length < n && pool.length) {
    drawn.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  }
  return drawn;
}

// Fisher-Yates shuffle on a seeded stream — the same input order
// always shuffles to the same output order.
export function shuffle(rand, list) {
  const shuffled = list.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Weighted pick: `items` are [value, weight] pairs. A weight of zero
// can never be picked; the last item wins any rounding remainder.
export function weightedPick(rand, items) {
  const total = items.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rand() * total;
  for (const [value, weight] of items) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return items[items.length - 1][0];
}

// --- Math helpers ----------------------------------------------------

// Clamp v into [lo, hi].
export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

// Linear interpolation between a and b at t.
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Smoothstep: eases t in [0, 1] so motion starts and ends gently.
export function smooth(t) {
  return t * t * (3 - 2 * t);
}

// --- Hashing ---------------------------------------------------------

// A deterministic hash of an (x, y) pair, in [0, 1). Used to give the
// same street corner the same awning colour on every run, without
// storing any per-corner state.
export function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// A fair coin flip from a seeded stream: true half the time.
export function coinFlip(rand) {
  return rand() < 0.5;
}
