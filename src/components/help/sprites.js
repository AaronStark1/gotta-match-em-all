import { defineSprite } from "../pixel/pixelArt";
import { GOLD } from "../pixel/glyphs";

/*
 * Small original pixel glyphs for the Help page. Press Start 2P has no
 * arrows, stars or icons, so these are drawn as crisp inline SVG instead of
 * relying on fallback-font characters.
 */

const INK = "#1b1d26";
const GOLD_DARK = "#b8860b"; // --poke-yellow-dark

/** Chunky "next step" arrow (points right; rotate 90deg to point down). */
export const STEP_ARROW = defineSprite(
  [
    "....k....",
    "....kk...",
    "kkkkkYk..",
    "kYYYYYYk.",
    "kYYYYYYYk",
    "kyyyyyyk.",
    "kkkkkyk..",
    "....kk...",
    "....k....",
  ],
  { k: "#000", Y: GOLD, y: GOLD_DARK }
);

/** Arrow-key glyph (points up; rotated in CSS). Inherits the text colour. */
export const KEY_ARROW = defineSprite(
  ["...k...", "..kkk..", ".kkkkk.", "kkkkkkk", "..kkk..", "..kkk..", "..kkk.."],
  { k: "currentColor" }
);

/** White glove pointer that "taps" the face-down card. */
export const TAP_HAND = defineSprite(
  [
    "....kk......",
    "...kWWk.....",
    "...kWWk.....",
    "...kWWkkk...",
    "...kWWkWWkk.",
    ".kkkWWkWWkWk",
    "kWWkWWWWWkWk",
    "kWWkWWWWWWWk",
    "kWWWWWWWWWgk",
    ".kWWWWWWWWgk",
    "..kWWWWWWggk",
    "..kWWWWWWWk.",
    "...kWWWWgk..",
    "...kkkkkkk..",
  ],
  { k: INK, W: "#ffffff", g: "#c3c8d2" }
);

/** 16x16 stopwatch (same grid as nes.css icons) for "the clock starts". */
export const CLOCK = defineSprite(
  [
    "......kkkk......",
    ".......RR.......",
    ".....kkkkkk.....",
    "...kkWWWWWWkk...",
    "..kWWWWkWWWWgk..",
    "..kWWWWkWWWWgk..",
    ".kWWWWWkWWWWWgk.",
    ".kWWWWWkWWWWWgk.",
    ".kWWWWWkkkkWWgk.",
    ".kWWWWWWWWWWWgk.",
    ".kWWWWWWWWWWWgk.",
    "..kWWWWWWWWWgk..",
    "..kgWWWWWWWggk..",
    "...kkggggggkk...",
    ".....kkkkkk.....",
    "................",
  ],
  { k: "#060606", W: "#fffdf2", g: "#adafbc", R: "#ee1515" }
);

/** Blinking "more text" cursor in the corner of the speech balloon. */
export const MORE_CURSOR = defineSprite(["kkkkk", ".kkk.", "..k.."], { k: "#212529" });
