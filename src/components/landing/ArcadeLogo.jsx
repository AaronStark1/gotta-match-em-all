import PixelSprite from "../pixel/PixelSprite";
import { SPARKLE } from "../pixel/glyphs";
import { SPARKLE_SMALL } from "./sprites";

/**
 * The 3D arcade logo with its twinkling glints and the "8-BIT MEMORY ARCADE"
 * plate. It is the page's <h1> on both the title screen and the main menu.
 */
const ArcadeLogo = () => (
  <div className="landing-hero">
    <div className="landing-logo-wrap">
      <h1 className="landing-logo">
        <span className="landing-logo-line">Gotta Match</span>{" "}
        <span className="landing-logo-line">'Em All!</span>
      </h1>
      <PixelSprite sprite={SPARKLE} pixelSize={3} className="landing-glint landing-glint--a" />
      <PixelSprite sprite={SPARKLE_SMALL} pixelSize={3} className="landing-glint landing-glint--b" />
    </div>
    <p className="landing-subtitle">
      <span className="landing-subtitle-star" aria-hidden="true">★</span> 8-BIT MEMORY ARCADE{" "}
      <span className="landing-subtitle-star" aria-hidden="true">★</span>
    </p>
  </div>
);

export default ArcadeLogo;
