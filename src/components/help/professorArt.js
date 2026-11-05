import { defineSprite } from "../pixel/pixelArt";

/**
 * Original 32x32 pixel portrait of a friendly, grey-haired Pokémon professor
 * in a lab coat (drawn for this project; not traced from any game sprite).
 */
const PROFESSOR_PALETTE = {
  k: "#1b1d26", // outline
  L: "#f2f4f8", // hair highlight
  H: "#c5cad6", // hair
  h: "#8b91a3", // hair shade / brows
  S: "#f7cfa6", // skin
  s: "#dda27a", // skin shade
  e: "#1b1d26", // eyes
  m: "#c25a46", // mouth
  C: "#f6f6f1", // lab coat
  c: "#b9bfcc", // lab coat shade
  B: "#8fb3e3", // shirt
  R: "#ee1515", // tie
  r: "#a10e0e", // tie shade
  Y: "#ffcb05", // pen
};

const PROFESSOR_ROWS = [
  "................................",
  ".............kk..kk.............",
  "..........kk.kLk.kLkk...........",
  ".........kLLkkLHkkLHLk.kk.......",
  "........kLHHHkLHHkLHHHkLk.......",
  ".......kLHHHHHHHHHHHHHHHHk......",
  "......kLHHHHHHHHHHHHHHHHHHk.....",
  "......kHHHHHHHHHHHHHHHHHHHk.....",
  "......kHHHHHHHHHHHHHHHHHHHk.....",
  "......kHHhhSSSSSSSSSShhHHHk.....",
  "......kHHhSSSSSSSSSSSShHHHk.....",
  "......kHHhShhhhSShhhhShHHHk.....",
  "......kHksSSSeSSSSeSSSskHHk.....",
  "......kHksSSSeSSSSeSSSskHHk.....",
  ".......kksSSSSSSsSSSSSskk.......",
  ".........kSSSSSssSSSSSk.........",
  ".........kSSHHHHHHHHSSk.........",
  ".........kShHHhhhhHHhSk.........",
  ".........kSSSSmmmmSSSSk.........",
  "..........kSSSSssSSSSk..........",
  "...........ksSSSSSSsk...........",
  "............kkkkkkkk............",
  "....kkCCCCCCksssssskCCCCCCkk....",
  "...kCCCCCCCcBBBRRBBBcCCCCCCCk...",
  "..kCCCCCCCCCcBBRRBBcCCCCCCCCCk..",
  "..kcCCCCCCCCCcBRRBcCCCCCCCCCck..",
  "..kcCCCCCCCCCCcRRcCCCcccccCCck..",
  "..kcCCCCCCCCCCcRrcCCCcYCCcCCck..",
  "..kcCCCCCCCCCCCcrcCCCcYCCcCCck..",
  "..kcCCCCCCCCCCCCcCCCCcccccCCck..",
  "..kcCCCCCCCCCCCCCCCCCCCCCCCCck..",
  "..kcCCCCCCCCCCCCCCCCCCCCCCCCck..",
];

/** Drawn over the face for a frame now and then: eyes closed. */
const PROFESSOR_BLINK_ROWS = [
  ...Array(12).fill(""),
  ".............S....S",
  "............ee....ee",
];

export const PROFESSOR_SPRITE = defineSprite(PROFESSOR_ROWS, PROFESSOR_PALETTE);

/** Same 32x32 grid as the portrait so the overlay lines up pixel-for-pixel. */
export const PROFESSOR_BLINK = defineSprite(PROFESSOR_BLINK_ROWS, PROFESSOR_PALETTE, {
  width: PROFESSOR_SPRITE.width,
  height: PROFESSOR_SPRITE.height,
});
