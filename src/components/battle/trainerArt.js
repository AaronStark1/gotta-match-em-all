import { defineSprite } from "../pixel/pixelArt";

/**
 * Original pixel art for the player's side of the 404 battle: a generic
 * trainer seen from behind (cap, backpack), the little party Poké Ball icons
 * and the menu cursor / "more text" arrow. Drawn from scratch as character
 * maps ("." = transparent) and built into sprites once, at module load (see
 * pixelArt.js).
 */

const TRAINER_PALETTE = {
  k: "#1a1d24",
  r: "#ee1515",
  P: "#ff7b6b",
  R: "#a30f0f",
  w: "#fffdf2",
  h: "#4a3326",
  H: "#6e4c37",
  s: "#f4c28e",
  S: "#c98d5c",
  b: "#2a75bb",
  B: "#0c3364",
  y: "#ffcb05",
  Y: "#b8860b",
  g: "#c9ced8",
};

const TRAINER_MAP = [
  "........kkkkkkkk........",
  "......kkrrrrrrrrkk......",
  ".....krrPPrrrrrrrrk.....",
  "....krrPrrrrrrrrrrrk....",
  "....krrrrrrrrrrrrrrk....",
  "...krrrrrrrkkrrrrrrrk...",
  "...krrrrrrkhhkrrrrrrk...",
  "...kRRRRRRkwwkRRRRRRk...",
  "...kkkkkkkkkkkkkkkkkk...",
  "...khhhHhhhHhhhHhhhhk...",
  "..kskhhHhhhHhhhHhhhksk..",
  "..kSkhhHhhhHhhhHhhhkSk..",
  "...kkhhHhhhHhhhHhhhkk...",
  "....kkhHhhhHhhhHhhkk....",
  ".....kkkkSSSSSSkkkk.....",
  "...kkkbBbkSSSSkbBbkkk...",
  ".kkbbbbBbbkkkkbbBbbbbkk.",
  "kbbbbbkkkkkkkkkkkkbbbbbk",
  "kbbbbbkyyyyyyyyyykbbbbbk",
  "kbbbbbkyYYYYYYYYykbbbbbk",
  "kbbBbbkyyyyggyyyykbbBbbk",
  "kbbBbbkyyyykkyyyykbbBbbk",
  "kbbBbbkyyyyyyyyyykbbBbbk",
  "kbbBbbkYYYYYYYYYYkbbBbbk",
];

/** 7x7 party ball shown in the player's status box. */
const PARTY_BALL_PALETTE = { k: "#1a1d24", r: "#ee1515", P: "#ff9d8f", w: "#fffdf2" };

const PARTY_BALL_MAP = [
  "..kkk..",
  ".krrrk.",
  "krPrrrk",
  "kkkwkkk",
  "kwwwwwk",
  ".kwwwk.",
  "..kkk..",
];

/** 12x12 still Poké Ball, swapped in for the spinning GIF under reduced motion. */
const STATIC_BALL_PALETTE = {
  k: "#1a1d24",
  r: "#ee1515",
  P: "#ff9d8f",
  w: "#fffdf2",
  g: "#c9ced8",
};

const STATIC_BALL_MAP = [
  "....kkkk....",
  "..kkrrrrkk..",
  ".krPPrrrrrk.",
  ".krPrrrrrrk.",
  "krrrrkkrrrrk",
  "kkkkkwwkkkkk",
  "kkkkkwwkkkkk",
  "kwwwwkkwwwwk",
  ".kwwwwwwwwk.",
  ".kgwwwwwwwk.",
  "..kkggwwkk..",
  "....kkkk....",
];

/** Menu cursor (a pixel "▶") and the blinking "more text" arrow ("▼"). */
const ARROW_PALETTE = { k: "currentColor" };

const CURSOR_MAP = ["k...", "kk..", "kkk.", "kkkk", "kkk.", "kk..", "k..."];

const PROMPT_MAP = ["kkkkkkk", ".kkkkk.", "..kkk..", "...k..."];

export const TRAINER_SPRITE = defineSprite(TRAINER_MAP, TRAINER_PALETTE);
export const PARTY_BALL_SPRITE = defineSprite(PARTY_BALL_MAP, PARTY_BALL_PALETTE);
export const STATIC_BALL_SPRITE = defineSprite(STATIC_BALL_MAP, STATIC_BALL_PALETTE);
export const CURSOR_SPRITE = defineSprite(CURSOR_MAP, ARROW_PALETTE);
export const PROMPT_SPRITE = defineSprite(PROMPT_MAP, ARROW_PALETTE);
