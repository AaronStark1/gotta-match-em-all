import { defineSprite } from "../pixel/pixelArt";
import { GOLD, WHITE } from "../pixel/glyphs";

/**
 * Original pixel-art sprites for the title screen, drawn as character maps
 * (see src/components/pixel/pixelArt.js). Built once, at module load. The
 * play icon and large sparkle are shared: see src/components/pixel/glyphs.js.
 */

/** Chunky question mark for the Help button. */
export const HELP_ICON = defineSprite(
  [
    ".XXXX.",
    "XX..XX",
    "....XX",
    "..XXX.",
    "..XX..",
    "......",
    "..XX..",
  ],
  { X: "currentColor" }
);

/** Small diamond glint. */
export const SPARKLE_SMALL = defineSprite(
  [
    "..Y..",
    ".YWY.",
    "YWWWY",
    ".YWY.",
    "..Y..",
  ],
  { Y: GOLD, W: WHITE }
);
