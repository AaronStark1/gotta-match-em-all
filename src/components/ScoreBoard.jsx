import { useEffect, useState } from "react";
import { formatTime } from "../utils/format";
import "../styles/ScoreBoard.css";

const ScoreBoard = ({ score, moves, elapsed, matchedPairs, totalPairs, best, difficulty }) => {
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
    <aside
      className={`scoreboard nes-container is-rounded is-dark ${pulse ? "pulse" : ""}`}
      aria-label="Game stats"
    >
      <div className="hud-header">
        <span className="nes-badge hud-badge">
          <span className="is-warning">{difficulty.label}</span>
        </span>
      </div>

      <dl className="hud-stats">
        <div className="hud-stat">
          <dt>Score:</dt>
          <dd className="nes-text is-warning">{score}</dd>
        </div>
        <div className="hud-stat">
          <dt>Moves:</dt>
          <dd className="nes-text is-success">{moves}</dd>
        </div>
        <div className="hud-stat">
          <dt>Time:</dt>
          <dd className="nes-text is-primary">
            <time dateTime={`PT${elapsed}S`}>{formatTime(elapsed)}</time>
          </dd>
        </div>
        <div className="hud-stat">
          <dt>Pairs:</dt>
          <dd>
            {matchedPairs}/{totalPairs}
          </dd>
        </div>
      </dl>

      <dl className="hud-best">
        <div className="hud-stat">
          <dt>Best:</dt>
          <dd className="nes-text is-warning">{bestScore ?? "---"}</dd>
        </div>
        <div className="hud-stat">
          <dt>Best Time:</dt>
          <dd className="nes-text is-warning">
            {bestTime === null ? "--:--" : formatTime(bestTime)}
          </dd>
        </div>
      </dl>
    </aside>
  );
};

export default ScoreBoard;
