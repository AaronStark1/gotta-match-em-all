import { defineSprite } from "./pixelArt";

/**
 * Original pixel glyphs shared across screens (title screen, Help manual,
 * win screen). Screen-specific art lives next to each screen.
 */
export const GOLD = "#ffcb05"; // --poke-yellow
export const WHITE = "#ffffff";

/** "Play" triangle (Start Game, Play Again); inherits the text colour. */
export const PLAY_ICON = defineSprite(
  [
    "X......",
    "XXX....",
    "XXXXX..",
    "XXXXXXX",
    "XXXXX..",
    "XXX....",
    "X......",
  ],
  { X: "currentColor" }
);

/** Four-point twinkle with a white-hot core. */
export const SPARKLE = defineSprite(
  [
    "...Y...",
    "...Y...",
    "..YWY..",
    "YYWWWYY",
    "..YWY..",
    "...Y...",
    "...Y...",
  ],
  { Y: GOLD, W: WHITE }
);
