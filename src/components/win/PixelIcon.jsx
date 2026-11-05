import PixelSprite from "../pixel/PixelSprite";
import { defineSprite } from "../pixel/pixelArt";
import { PLAY_ICON } from "../pixel/glyphs";

/** Tiny original pixel icons for the win screen's buttons, drawn in currentColor. */
const ICONS = {
  play: PLAY_ICON,
  home: defineSprite(
    ["...#...", "..###..", ".#####.", "#######", ".#####.", ".##.##.", ".##.##."],
    { "#": "currentColor" }
  ),
};

/** Decorative pixel icon ("play" or "home"). */
const PixelIcon = ({ name, className = "" }) => {
  const sprite = ICONS[name];
  if (!sprite) return null;
  return <PixelSprite sprite={sprite} className={`win-pixel-icon ${className}`} />;
};

export default PixelIcon;
