import { useEffect, useState } from "react";
import RecordValue from "./RecordValue";
import { formatScore, formatTime } from "../utils/format";
import "../styles/ScoreBoard.css";

/**
 * Arcade HUD: score (with floating +100 / -20 popups), moves, MM:SS clock,
 * pairs and this difficulty's best record.
 */
const ScoreBoard = ({
  score,
  moves,
  elapsed,
  matchedPairs,
  totalPairs,
  best,
  difficulty,
  popup = null,
}) => {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    // The HUD stays mounted across boards, so clear a pending glow on reset.
    if (score <= 0) {
      setPulse(false);
      return undefined;
    }
    setPulse(true);
    const timeout = setTimeout(() => setPulse(false), 600);
    return () => clearTimeout(timeout);
  }, [score]);

  const bestScore = best?.score ?? null;
  const bestTime = best?.time ?? null;

  return (
    <aside className={`scoreboard nes-container is-dark ${pulse ? "pulse" : ""}`} aria-label="Game stats">
      <div className="hud-header">
        <span className="nes-badge hud-badge">
          <span className="is-warning">{difficulty.label}</span>
        </span>
      </div>

      <dl className="hud-stats">
        <div className="hud-stat hud-score">
          <dt>Score</dt>
          <dd className="nes-text is-warning">
            {formatScore(score)}
            {popup && (
              <span
                key={popup.key}
                className={`score-popup ${popup.delta > 0 ? "is-gain" : "is-loss"}`}
                aria-hidden="true"
              >
                {popup.delta > 0 ? `+${popup.delta}` : popup.delta}
              </span>
            )}
          </dd>
        </div>
        <div className="hud-stat">
          <dt>Moves</dt>
          <dd className="nes-text is-success">{moves}</dd>
        </div>
        <div className="hud-stat">
          <dt>Time</dt>
          <dd className="nes-text is-primary">
            <time dateTime={`PT${elapsed}S`}>{formatTime(elapsed)}</time>
          </dd>
        </div>
        <div className="hud-stat">
          <dt>Pairs</dt>
          <dd>
            {matchedPairs}/{totalPairs}
          </dd>
        </div>
      </dl>

      <dl className="hud-best">
        <div className="hud-stat">
          <dt>Best</dt>
          <dd className="nes-text is-warning">
            <RecordValue value={bestScore === null ? null : formatScore(bestScore)} placeholder="---" />
          </dd>
        </div>
        <div className="hud-stat">
          <dt>Best Time</dt>
          <dd className="nes-text is-warning">
            <RecordValue value={bestTime === null ? null : formatTime(bestTime)} placeholder="--:--" />
          </dd>
        </div>
      </dl>
    </aside>
  );
};

export default ScoreBoard;
