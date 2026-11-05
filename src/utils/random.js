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

export function pickOne(items) {
  return items[Math.floor(Math.random() * items.length)];
}
