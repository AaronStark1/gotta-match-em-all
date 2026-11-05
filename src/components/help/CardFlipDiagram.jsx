import MiniCard from "./MiniCard";
import PixelSprite from "../pixel/PixelSprite";
import { STEP_ARROW, TAP_HAND } from "./sprites";
import { SPARKLE } from "../pixel/glyphs";
import { MISMATCH_DELAY_MS } from "../../game/gameReducer";
import { formatPokemonName } from "../../utils/format";

const DEMO_DEX_ID = 25;
const DEMO_NAME = formatPokemonName("pikachu");
/**
 * Pikachu's sprite framing, as the board would measure it (measureSpriteFit),
 * fixed here so the diagram needs no CORS request or canvas work.
 */
const DEMO_FIT = { k: 1.795, cx: 0.526, cy: 0.49 };

const flipBackDelay = () => {
  const seconds = MISMATCH_DELAY_MS / 1000;
  return seconds === 1 ? "a second" : `${seconds} seconds`;
};

const StepTitle = ({ number, children }) => (
  <p className="help-step-title">
    <span className="help-step-num">
      <span className="visually-hidden">Step </span>
      {number}
    </span>{" "}
    {children}
  </p>
);

/**
 * Three-step "how a turn works" strip: Flip -> Remember -> Match!
 * The mini cards, arrows and sparkles are decorative; each step's title and
 * sentence are real text in an ordered list.
 */
const CardFlipDiagram = () => (
  <ol className="help-steps" role="list">
    <li className="help-step">
      <div className="help-step-art" aria-hidden="true">
        <span className="help-tap">
          <MiniCard />
          <PixelSprite sprite={TAP_HAND} pixelSize={1} className="help-hand" />
        </span>
      </div>
      <StepTitle number={1}>Flip</StepTitle>
      <p className="help-step-text">Tap, click or press Enter on a face-down card to turn it over.</p>
    </li>

    <li className="help-step">
      <PixelSprite sprite={STEP_ARROW} pixelSize={1} className="help-step-arrow" />
      <div className="help-step-art" aria-hidden="true">
        <MiniCard faceUp dexId={DEMO_DEX_ID} name={DEMO_NAME} spriteFit={DEMO_FIT} />
      </div>
      <StepTitle number={2}>Remember</StepTitle>
      <p className="help-step-text">
        Flip a second card. No match? Both flip back after {flipBackDelay()}, so remember where
        they were!
      </p>
    </li>

    <li className="help-step">
      <PixelSprite sprite={STEP_ARROW} pixelSize={1} className="help-step-arrow" />
      <div className="help-step-art" aria-hidden="true">
        <span className="help-pair">
          <MiniCard faceUp matched dexId={DEMO_DEX_ID} name={DEMO_NAME} spriteFit={DEMO_FIT} />
          <MiniCard faceUp matched dexId={DEMO_DEX_ID} name={DEMO_NAME} spriteFit={DEMO_FIT} />
          <PixelSprite sprite={SPARKLE} pixelSize={1} className="help-sparkle is-a" />
          <PixelSprite sprite={SPARKLE} pixelSize={1} className="help-sparkle is-b" />
          <PixelSprite sprite={SPARKLE} pixelSize={1} className="help-sparkle is-c" />
        </span>
      </div>
      <StepTitle number={3}>Match!</StepTitle>
      <p className="help-step-text">
        Two of the same Pokémon stay face-up. Match every pair to clear the board!
      </p>
    </li>
  </ol>
);

export default CardFlipDiagram;
