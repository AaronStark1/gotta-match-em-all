import PixelSprite, { PixelPaths } from "../pixel/PixelSprite";
import { PROFESSOR_BLINK, PROFESSOR_SPRITE } from "./professorArt";

/**
 * Original 32x32 pixel-art professor (grey hair, lab coat). Decorative: the
 * nameplate and speech balloon next to it carry the meaning. The eyes-closed
 * layer is shown for a frame now and then by CSS (`.help-oak-blink`).
 */
const ProfessorPortrait = ({ className = "" }) => (
  <PixelSprite sprite={PROFESSOR_SPRITE} pixelSize={1} className={`help-oak-portrait ${className}`}>
    <g className="help-oak-blink">
      <PixelPaths sprite={PROFESSOR_BLINK} />
    </g>
  </PixelSprite>
);

export default ProfessorPortrait;
