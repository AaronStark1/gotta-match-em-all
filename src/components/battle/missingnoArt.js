import { createSeededRng } from "../../utils/random";

/**
 * Original "MISSINGNO." glitch sprite, generated rather than drawn (and not
 * traced from any game): a jagged staircase of 6x6 tiles, each filled with
 * pseudo-random scanline garbage from a fixed seed, so it is identical on
 * every render. Two extra frames re-roll some tiles and tear a few pixel
 * rows sideways; the page flashes them briefly for a stepped glitch flicker.
 */

const TILE = 6;
/** Transparent columns either side, so torn rows can spill past the edge. */
const MARGIN = 3;

/** Tile-level silhouette: "#" = garbage tile, "." = empty. */
const SILHOUETTE = [
  "......##",
  ".#...###",
  "......##",
  "....####",
  "..#.####",
  ".#######",
  "########",
  "####.###",
];

export const MISSINGNO_PALETTE = {
  k: "#0f1218",
  d: "#363c4a",
  m: "#7d8494",
  l: "#c9ced8",
  w: "#fffdf2",
  b: "#2a75bb",
  r: "#ee1515",
  y: "#ffcb05",
};

const SHADES = ["k", "k", "d", "d", "m", "l"];
const ACCENTS = ["b", "r", "y"];

const pick = (rng, list) => list[Math.floor(rng() * list.length)];

/** Two different colours for a tile; now and then one is a "corrupt" accent. */
function pickPair(rng) {
  const a = rng() < 0.1 ? pick(rng, ACCENTS) : pick(rng, SHADES);
  let b = pick(rng, SHADES);
  if (b === a) b = a === "k" ? "l" : "k";
  return [a, b];
}

/** One 6x6 tile of garbage as an array of 6 strings. */
function paintTile(rng) {
  const [a, b] = pickPair(rng);
  const accent = rng() < 0.2 ? pick(rng, ACCENTS) : "w";
  const style = rng();
  const rows = [];

  for (let y = 0; y < TILE; y += 1) {
    let row = "";
    for (let x = 0; x < TILE; x += 1) {
      let char;
      if (style < 0.18) {
        // Static noise
        const n = rng();
        char = n < 0.48 ? a : n < 0.94 ? b : accent;
      } else if (style < 0.36) {
        // Horizontal scanlines
        char = y % 2 === 0 ? a : b;
      } else if (style < 0.5) {
        // Vertical bars
        char = x % 3 === 2 ? b : a;
      } else if (style < 0.63) {
        // Dither checkerboard
        char = (x + y) % 2 === 0 ? a : b;
      } else if (style < 0.76) {
        // Solid block with a stuck pixel
        char = x === 4 && y === 1 ? accent : a;
      } else if (style < 0.88) {
        // Split tile: top half one colour, bottom half another
        char = y < 3 ? a : b;
      } else {
        // Corrupted "glyph": a hollow box on a solid field
        const side = (x === 1 || x === 4) && y >= 1 && y <= 4;
        const lid = (y === 1 || y === 4) && x >= 1 && x <= 4;
        char = side || lid ? b : a;
      }
      row += char;
    }
    rows.push(row);
  }
  return rows;
}

/** Fill the silhouette with tiles; `reroll` re-paints that share of tiles. */
function buildGrid(seed, rerollSeed, reroll) {
  const rng = createSeededRng(seed);
  const rerollRng = createSeededRng(rerollSeed);
  const width = SILHOUETTE[0].length * TILE + MARGIN * 2;
  const grid = [];

  SILHOUETTE.forEach((tileRow) => {
    const band = Array.from({ length: TILE }, () => ".".repeat(MARGIN));
    for (const cell of tileRow) {
      // Always draw from `rng` so the base tiles stay identical across frames.
      const tile = cell === "#" ? paintTile(rng) : null;
      const shown = tile && rerollRng() < reroll ? paintTile(rerollRng) : tile;
      for (let y = 0; y < TILE; y += 1) {
        band[y] += shown ? shown[y] : ".".repeat(TILE);
      }
    }
    band.forEach((row) => grid.push(row + ".".repeat(width - row.length)));
  });
  return grid;
}

/** Shift whole pixel rows sideways: { rowIndex: offset }. */
function tear(grid, offsets) {
  return grid.map((row, y) => {
    const offset = offsets[y] || 0;
    if (offset === 0) return row;
    if (offset > 0) return ".".repeat(offset) + row.slice(0, row.length - offset);
    return row.slice(-offset) + ".".repeat(-offset);
  });
}

/** Swap light and dark shades on a band of rows (a palette glitch). */
function invertRows(grid, from, to) {
  const swap = { k: "l", l: "k", d: "m", m: "d" };
  return grid.map((row, y) =>
    y < from || y > to ? row : row.replace(/[kdml]/g, (char) => swap[char])
  );
}

const SEED = 404;

const base = tear(buildGrid(SEED, 1, 0), { 25: 1, 40: -1 });
const glitchA = tear(buildGrid(SEED, 4040, 0.3), { 7: 2, 8: 2, 21: -3, 22: -3, 23: -1, 38: 3 });
const glitchB = invertRows(tear(base, { 12: -3, 13: -3, 14: -3, 30: 2, 31: 2, 44: -2 }), 26, 33);

/** Frame 0 is the resting sprite; frames 1-2 are the glitch flashes. */
export const MISSINGNO_FRAMES = [base, glitchA, glitchB];
