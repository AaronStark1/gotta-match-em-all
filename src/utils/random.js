/** Unbiased Fisher–Yates shuffle; returns a new array. */
export function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Pick `count` distinct values from `pool` that are not already in `used`.
 * Picked values are added to `used` so follow-up calls never repeat them.
 */
export function pickDistinct(pool, count, used = new Set()) {
  const available = pool.filter((value) => !used.has(value));
  const picked = shuffle(available).slice(0, count);
  picked.forEach((value) => used.add(value));
  return picked;
}

/** Deterministic PRNG (mulberry32): same seed, same sequence, every render. */
export function createSeededRng(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickOne(items) {
  return items[Math.floor(Math.random() * items.length)];
}
