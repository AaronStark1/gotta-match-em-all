import { useEffect, useId, useReducer } from "react";
import { DIFFICULTIES } from "../../config/difficulty";
import { getBestRecord } from "../../utils/records";
import { getPokedexCount, POKEDEX_SIZE } from "../../utils/pokedex";
import { formatScore, formatTime } from "../../utils/format";
import RecordValue from "../RecordValue";

/**
 * "HALL OF FAME" banner: best score and time for the selected difficulty plus
 * overall Pokédex progress. The stats are a polite, atomic live region whose
 * hidden prefix names the difficulty, so switching difficulty is announced
 * with context ("Hard difficulty records: High score …").
 */
const HallOfFame = ({ difficulty }) => {
  const titleId = useId();
  // Records are read straight from localStorage on render; re-render when
  // another tab finishes a game so the banner never shows stale numbers.
  const [, refresh] = useReducer((count) => count + 1, 0);

  useEffect(() => {
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  const best = getBestRecord(difficulty);
  const caught = getPokedexCount();
  const label = DIFFICULTIES[difficulty]?.label ?? difficulty;

  return (
    <section
      className="nes-container is-dark with-title is-centered landing-hof"
      aria-labelledby={titleId}
    >
      <h2 id={titleId} className="title landing-hof-title">
        <i className="nes-icon trophy is-small" aria-hidden="true"></i>
        <span>Hall of Fame</span>
        <i className="nes-icon trophy is-small" aria-hidden="true"></i>
      </h2>

      <div className="landing-hof-body" aria-live="polite" aria-atomic="true">
        <span className="visually-hidden">{label} difficulty records:</span>
        <dl className="landing-hof-stats">
          <div className="landing-hof-stat">
            <dt className="landing-hof-label">High Score</dt>
            <dd className={`landing-hof-value ${best.score === null ? "is-empty" : ""}`}>
              <RecordValue
                value={best.score === null ? null : formatScore(best.score)}
                placeholder="---"
              />
            </dd>
          </div>
          <div className="landing-hof-stat">
            <dt className="landing-hof-label">Best Time</dt>
            <dd className={`landing-hof-value ${best.time === null ? "is-empty" : ""}`}>
              <RecordValue
                value={best.time === null ? null : formatTime(best.time)}
                placeholder="--:--"
              />
            </dd>
          </div>
          <div className="landing-hof-stat">
            <dt className="landing-hof-label landing-hof-label--dex">POKéDEX</dt>
            <dd className="landing-hof-value landing-hof-value--dex">
              <span aria-hidden="true">
                {caught}/{POKEDEX_SIZE}
              </span>
              <span className="visually-hidden">
                {caught} of {POKEDEX_SIZE} caught
              </span>
              <progress
                className="nes-progress is-warning landing-hof-progress"
                value={caught}
                max={POKEDEX_SIZE}
                aria-hidden="true"
              />
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
};

export default HallOfFame;
