import { memo } from "react";
import { PixelPaths } from "../pixel/PixelSprite";
import { defineSprite } from "../pixel/pixelArt";
import { MISSINGNO_FRAMES, MISSINGNO_PALETTE } from "./missingnoArt";
import "./Battle.css";

const FRAMES = MISSINGNO_FRAMES.map((rows) => defineSprite(rows, MISSINGNO_PALETTE));
const { width: WIDTH, height: HEIGHT } = FRAMES[0];

/**
 * The wild MISSINGNO.: an original, seeded block-glitch sprite. Frame 0 is
 * the resting pose; frames 1-2 flash briefly via a stepped CSS animation
 * (switched off under prefers-reduced-motion). The three frames share one
 * SVG as separately animated layers, so this can't be a plain <PixelSprite>.
 * Memoised: it never changes.
 */
const MissingNo = ({ className = "" }) => (
  <svg
    className={`missingno ${className}`}
    viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
    shapeRendering="crispEdges"
    focusable="false"
    role="img"
    aria-label="MISSINGNO., a glitchy jumble of scrambled pixel blocks"
  >
    {FRAMES.map((frame, index) => (
      <g key={index} className={`missingno__frame missingno__frame--${index}`}>
        <PixelPaths sprite={frame} />
      </g>
    ))}
  </svg>
);

export default memo(MissingNo);
