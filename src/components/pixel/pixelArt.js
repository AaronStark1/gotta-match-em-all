/**
 * Shared pixel-art toolkit for the app's original inline-SVG sprites.
 *
 * Art is authored as a character map: an array of strings, one per pixel row,
 * where each character is a palette key. Characters missing from the palette
 * (conventionally ".") are transparent. Each colour becomes a single <path>
 * made of one sub-path per horizontal run, so even the 404 page's glitchy
 * MISSINGNO. costs a couple of dozen nodes instead of thousands of <rect>s.
 */

/** Width/height of a character map (the widest row wins). */
function mapSize(rows) {
  return {
    width: rows.reduce((widest, row) => Math.max(widest, row.length), 0),
    height: rows.length,
  };
}

/** Character map -> [{ fill, d }]: one SVG path per colour, in first-use order. */
function toPaths(rows, palette) {
  const paths = new Map();
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const key = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === key) end += 1;
      const fill = palette[key];
      if (fill) paths.set(fill, `${paths.get(fill) || ""}M${x} ${y}h${end - x}v1h-${end - x}z`);
      x = end;
    }
  });
  return Array.from(paths, ([fill, d]) => ({ fill, d }));
}

/**
 * Pre-computed sprite for <PixelSprite>: { width, height, paths }. Pass
 * `size` to pad a layer onto a larger grid (e.g. a blink overlay on a
 * portrait). Build sprites once, at module load.
 */
export function defineSprite(rows, palette, size = mapSize(rows)) {
  return { width: size.width, height: size.height, paths: toPaths(rows, palette) };
}
