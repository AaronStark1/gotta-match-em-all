import PixelSprite from "../pixel/PixelSprite";
import { SPARKLE } from "../pixel/glyphs";
import { SPARKLE_SMALL } from "./sprites";

/**
 * Decorative 8-bit sparkles and mini Poké Balls drifting in the side gutters
 * of the title screen (the page adds two more glints on the logo, for eight
 * accents in all). Purely CSS-animated (stepped transform/opacity), drawn
 * behind the menu, click-through, hidden from assistive tech, and frozen
 * under prefers-reduced-motion. Positions live in LandingPage.css.
 */
const ACCENTS = [
  { id: 1, kind: "sparkle", sprite: SPARKLE, pixelSize: 3 },
  { id: 2, kind: "ball" },
  { id: 3, kind: "sparkle", sprite: SPARKLE_SMALL, pixelSize: 3 },
  { id: 4, kind: "ball" },
  { id: 5, kind: "ball" },
  { id: 6, kind: "sparkle", sprite: SPARKLE, pixelSize: 3 },
];

const FloatingAccents = () => (
  <div className="landing-accents" aria-hidden="true">
    {ACCENTS.map(({ id, kind, sprite, pixelSize }) => (
      <span key={id} className={`landing-accent landing-accent--${kind} landing-accent--${id}`}>
        {kind === "ball" ? (
          <i className="nes-pokeball" />
        ) : (
          <PixelSprite sprite={sprite} pixelSize={pixelSize} />
        )}
      </span>
    ))}
  </div>
);

export default FloatingAccents;
