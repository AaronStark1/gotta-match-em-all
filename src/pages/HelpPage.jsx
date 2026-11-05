import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/HelpPage.css";
import SystemToggles from "../components/SystemToggles";
import CardFlipDiagram from "../components/help/CardFlipDiagram";
import PixelSprite from "../components/pixel/PixelSprite";
import ProfessorPortrait from "../components/help/ProfessorPortrait";
import StarRow from "../components/help/StarRow";
import { CLOCK, KEY_ARROW, MORE_CURSOR } from "../components/help/sprites";
import useCrt from "../display/useCrt";
import pokeballIcon from "../assets/poke-ball.png";
import { DIFFICULTIES, DIFFICULTY_ORDER, boardSizeLabel } from "../config/difficulty";
import { MATCH_POINTS, MISMATCH_PENALTY } from "../game/gameReducer";
import { RATING_TIERS, maxMovesForStars, ratioLabel } from "../game/rating";
import { formatScore } from "../utils/format";
import { POKEDEX_SIZE, getPokedexCount } from "../utils/pokedex";

const PAGE_TITLE = "How to Play | Gotta Match' Em All!";

/** Tiers that have a move limit (3 and 2 stars), best first. */
const LIMITED_TIERS = RATING_TIERS.filter((tier) => Number.isFinite(tier.ratioTenths));

const tierRule = (tier) =>
  Number.isFinite(tier.ratioTenths)
    ? `Finish in under ${ratioLabel(tier)} the minimum moves.`
    : "Finish the board in any number of moves.";

const ARROW_KEYS = [
  { dir: "left", label: "Left" },
  { dir: "up", label: "Up" },
  { dir: "down", label: "Down" },
  { dir: "right", label: "Right" },
];

const SectionHeading = ({ id, number, children }) => (
  <h2 id={id} className="help-h2">
    <span className="help-h2-num" aria-hidden="true">
      {number}
    </span>
    <span className="help-h2-text">{children}</span>
  </h2>
);

const Or = () => <span className="help-or">or</span>;

const HelpPage = () => {
  const navigate = useNavigate();
  const { crtOn } = useCrt();
  const [pokedexCount] = useState(getPokedexCount);

  useEffect(() => {
    const previous = document.title;
    document.title = PAGE_TITLE;
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className={`help-page ${crtOn ? "has-crt" : ""}`}>
      <main className="help-manual nes-container is-dark with-title" aria-labelledby="help-title">
        <p className="title help-tab" aria-hidden="true">
          Trainer Tips
        </p>

        <header className="help-header">
          <h1 id="help-title" className="help-title">
            <span className="help-title-kicker">Professor Oak's</span>{" "}
            <span className="help-title-main">
              Pok<span className="help-title-e">é</span>dex Training Manual
            </span>
          </h1>
          <SystemToggles className="help-toggles" />
        </header>

        <div className="help-intro">
          <div className="help-oak" aria-hidden="true">
            <div className="help-oak-frame">
              <ProfessorPortrait />
            </div>
            <p className="help-oak-name">Prof. Oak</p>
          </div>
          <div className="nes-balloon from-left help-balloon">
            <p>
              <span className="visually-hidden">Professor Oak says: </span>
              Welcome to the world of Pokémon memory, Trainer!
            </p>
            <p>Study this manual, then show me what you can do!</p>
            <PixelSprite sprite={MORE_CURSOR} pixelSize={1} className="help-balloon-more" />
          </div>
        </div>

        <div className="help-sections">
          <section className="help-section help-howto" aria-labelledby="help-howto-title">
            <SectionHeading id="help-howto-title" number={1}>
              How to Play
            </SectionHeading>
            <CardFlipDiagram />
            <ul className="help-notes" role="list">
              <li>Every two flips count as one move.</li>
              <li>Pick Easy, Medium or Hard on the title screen or during a game.</li>
              <li>
                Clear a board to register the Pokémon you matched in your Pokédex.{" "}
                <span className="help-dex-count">
                  Caught so far: {formatScore(pokedexCount)} / {formatScore(POKEDEX_SIZE)}
                </span>
              </li>
            </ul>
          </section>

          <section className="help-section help-controls" aria-labelledby="help-controls-title">
            <SectionHeading id="help-controls-title" number={2}>
              Controls
            </SectionHeading>
            <dl className="help-keys">
              <div className="help-key-row">
                <dt>
                  <kbd className="help-key">Tab</kbd>
                  <Or />
                  <span className="help-arrow-keys">
                    {ARROW_KEYS.map(({ dir, label }) => (
                      <kbd key={dir} className="help-key is-arrow">
                        <PixelSprite sprite={KEY_ARROW} pixelSize={1} className={`help-key-arrow is-${dir}`} />
                        <span className="visually-hidden">{label} arrow</span>
                      </kbd>
                    ))}
                  </span>
                </dt>
                <dd>Move between cards</dd>
              </div>
              <div className="help-key-row">
                <dt>
                  <kbd className="help-key">Enter</kbd>
                  <Or />
                  <kbd className="help-key">Space</kbd>
                </dt>
                <dd>Flip the selected card</dd>
              </div>
              <div className="help-key-row">
                <dt>
                  <span className="help-chip">Click</span>
                  <Or />
                  <span className="help-chip">Tap</span>
                </dt>
                <dd>Flip a card with mouse or touch</dd>
              </div>
              <div className="help-key-row">
                <dt>
                  <span className="help-chip is-switch">
                    <span aria-hidden="true">🔊</span> SFX<span className="visually-hidden"> switch</span>
                  </span>
                </dt>
                <dd>Turns sound effects on or off</dd>
              </div>
              <div className="help-key-row">
                <dt>
                  <span className="help-chip is-switch">
                    <span aria-hidden="true">📺</span> CRT<span className="visually-hidden"> switch</span>
                  </span>
                </dt>
                <dd>Turns the scanline filter on or off</dd>
              </div>
            </dl>
          </section>

          <section className="help-section help-scoring" aria-labelledby="help-scoring-title">
            <SectionHeading id="help-scoring-title" number={3}>
              Scoring
            </SectionHeading>
            <table className="nes-table is-dark is-bordered help-table help-score-table">
              <caption className="visually-hidden">Points, clock and records</caption>
              <colgroup>
                <col className="help-col-event" />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">Event</th>
                  <th scope="col">Result</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">
                    <span className="help-event">
                      <i className="nes-icon coin is-small" aria-hidden="true" />
                      <span>Match a pair</span>
                    </span>
                  </th>
                  <td>
                    <span className="help-pts is-plus">+{formatScore(MATCH_POINTS)}</span> points
                  </td>
                </tr>
                <tr>
                  <th scope="row">
                    <span className="help-event">
                      <i className="nes-icon close is-small" aria-hidden="true" />
                      <span>Miss</span>
                    </span>
                  </th>
                  <td>
                    <span className="help-pts is-minus">-{formatScore(MISMATCH_PENALTY)}</span> points.
                    Your score never drops below 0.
                  </td>
                </tr>
                <tr>
                  <th scope="row">
                    <span className="help-event">
                      <PixelSprite sprite={CLOCK} pixelSize={1} className="help-clock" />
                      <span>First flip</span>
                    </span>
                  </th>
                  <td>The clock starts ticking.</td>
                </tr>
                <tr>
                  <th scope="row">
                    <span className="help-event">
                      <i className="nes-icon trophy is-small" aria-hidden="true" />
                      <span>Board cleared</span>
                    </span>
                  </th>
                  <td>Your Best Score and Best Time are saved for each difficulty.</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="help-section help-rating" aria-labelledby="help-rating-title">
            <SectionHeading id="help-rating-title" number={4}>
              Star Rating
            </SectionHeading>
            <p className="help-lead">
              A perfect game takes one move per pair, so the minimum moves equal the number of pairs.
            </p>
            <ul className="help-tiers" role="list">
              {RATING_TIERS.map((tier) => (
                <li key={tier.stars} className="help-tier">
                  <StarRow stars={tier.stars} />
                  <p className="help-tier-copy">
                    <span className="help-tier-title">{tier.title}</span>
                    <span className="help-tier-rule">{tierRule(tier)}</span>
                  </p>
                </li>
              ))}
            </ul>
            <table className="nes-table is-dark is-bordered help-table help-limits">
              <caption className="help-caption">Most moves for each rating</caption>
              <colgroup>
                <col className="help-col-board" />
                <col className="help-col-pairs" />
                {LIMITED_TIERS.map((tier) => (
                  <col key={tier.stars} className="help-col-stars" />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">Board</th>
                  <th scope="col">Pairs</th>
                  {LIMITED_TIERS.map((tier) => (
                    <th scope="col" key={tier.stars} className="help-th-stars">
                      <StarRow stars={tier.stars} small decorative />
                      <span className="visually-hidden">{tier.stars} stars</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DIFFICULTY_ORDER.map((key) => {
                  const config = DIFFICULTIES[key];
                  return (
                    <tr key={key}>
                      <th scope="row">
                        <span className="help-board-name">{config.label}</span>{" "}
                        <span className="help-board-size">{boardSizeLabel(config)}</span>
                      </th>
                      <td>{config.pairs}</td>
                      {LIMITED_TIERS.map((tier) => (
                        <td key={tier.stars}>{maxMovesForStars(tier.stars, config.pairs)}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        </div>

        <footer className="help-actions">
          <button type="button" className="nes-btn is-error help-battle" onClick={() => navigate("/play")}>
            <span className="help-battle-ripple" aria-hidden="true" />
            <img src={pokeballIcon} alt="" className="help-battle-ball" width="30" height="30" />
            <span>Let's Battle!</span>
          </button>
          <button type="button" className="nes-btn is-primary help-home" onClick={() => navigate("/")}>
            <span aria-hidden="true">🏠</span>
            <span>Home</span>
          </button>
        </footer>
      </main>
    </div>
  );
};

export default HelpPage;
