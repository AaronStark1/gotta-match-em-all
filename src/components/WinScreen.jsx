import { useCallback, useEffect, useId, useRef } from "react";
import SystemToggles from "./SystemToggles";
import CaughtTray from "./win/CaughtTray";
import CheerSprite from "./win/CheerSprite";
import PixelIcon from "./win/PixelIcon";
import StarRating from "./win/StarRating";
import usePokeballConfetti from "./win/usePokeballConfetti";
import { trapTabKey, trayColumns } from "./win/winHelpers";
import { boardSizeLabel } from "../config/difficulty";
import { formatScore, formatTime } from "../utils/format";
import "../styles/WinScreen.css";

const NewBestBadge = () => (
  <span className="nes-badge win-new-best">
    <span className="is-warning">New Best!</span>
  </span>
);

/**
 * "Hall of Fame Induction": full-screen modal shown when a board is cleared.
 * Wide screens: hero + results on the left, caught Pokémon tray on the right.
 * Phones: one scrolling column with the actions pinned to the bottom.
 */
const WinScreen = ({ result, difficulty, onPlayAgain, onHome }) => {
  const dialogRef = useRef(null);
  const playAgainRef = useRef(null);
  const titleId = useId();
  const modeId = useId();
  const ratingId = useId();
  const resultsId = useId();

  usePokeballConfetti();

  // Initial focus on the main action. It lives in the (sticky) action bar,
  // so focusing it never scrolls the dialog away from its title.
  useEffect(() => {
    playAgainRef.current?.focus({ preventScroll: true });
  }, []);

  const handleKeyDown = useCallback((event) => trapTabKey(event, dialogRef.current), []);

  const { score, moves, time, rating, previousBest, isNewBestScore, isNewBestTime } = result;
  const bestScore = isNewBestScore ? score : previousBest.score;
  const bestTime = isNewBestTime ? time : previousBest.time;
  const hasBestScore = Number.isFinite(bestScore);
  const hasBestTime = Number.isFinite(bestTime);
  const bestScoreText = hasBestScore ? formatScore(bestScore) : "---";
  const bestTimeText = hasBestTime ? formatTime(bestTime) : "--:--";
  const hasBadge = Boolean(isNewBestScore || isNewBestTime);
  const caughtCount = result.caught.length;

  return (
    <div className="win-overlay">
      <div
        ref={dialogRef}
        className="win-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={`${modeId} ${ratingId} ${resultsId}`}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        style={{ "--tray-cols": trayColumns(caughtCount) }}
      >
        <div className="win-top">
          <p className="win-kicker">
            <i className="nes-icon trophy" aria-hidden="true" />
            <span>Hall of Fame</span>
          </p>
          <SystemToggles className="win-toggles" />
        </div>

        <div className="win-left">
          <div className="win-main">
            <h1 id={titleId} className="win-title">
              You Win!
            </h1>

            <div className="win-hero">
              <CheerSprite />

              <div className="win-hero-info">
                <p id={modeId} className="win-mode">
                  <span className="visually-hidden">{"Difficulty: "}</span>
                  <span
                    className="nes-badge win-mode-badge"
                    style={{ "--badge-chars": String(difficulty.label).length }}
                  >
                    <span className="is-warning">{difficulty.label}</span>
                  </span>
                  <span className="win-mode-size">
                    <span className="visually-hidden">{", board "}</span>
                    {boardSizeLabel(difficulty)}
                    <span aria-hidden="true"> · </span>
                    <span className="visually-hidden">{", "}</span>
                    {difficulty.pairs} pairs
                  </span>
                </p>

                <StarRating id={ratingId} rating={rating} moves={moves} />
              </div>
            </div>

            <div className="nes-container is-dark with-title win-results">
              <h2 className="title win-results-title">
                Results
              </h2>
              <dl id={resultsId} className={`win-ledger${hasBadge ? " has-badge" : ""}`}>
                <div className={`win-ledger-row${isNewBestScore ? " has-badge" : ""}`}>
                  <dt>Score</dt>
                  <dd>
                    <span className="win-ledger-value">{formatScore(score)}</span>
                    {isNewBestScore && <NewBestBadge />}
                  </dd>
                </div>
                <div className="win-ledger-row">
                  <dt>Moves</dt>
                  <dd>
                    <span className="win-ledger-value">{moves}</span>
                  </dd>
                </div>
                <div className={`win-ledger-row${isNewBestTime ? " has-badge" : ""}`}>
                  <dt>Time</dt>
                  <dd>
                    <span className="win-ledger-value">{formatTime(time)}</span>
                    {isNewBestTime && <NewBestBadge />}
                  </dd>
                </div>
                <div className="win-ledger-row is-best">
                  <dt>Best</dt>
                  <dd>
                    <span className="win-ledger-value" aria-hidden="true">
                      {hasBestScore ? `${bestScoreText} PTS` : bestScoreText} / {bestTimeText}
                    </span>
                    <span className="visually-hidden">
                      {`score ${hasBestScore ? `${bestScoreText} points` : "none yet"}, time ${
                        hasBestTime ? bestTimeText : "none yet"
                      }`}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Pinned to the bottom of the scrolling box; on phones it sits after the tray */}
          <div className="win-actions">
            <button
              ref={playAgainRef}
              type="button"
              className="nes-btn is-warning win-btn"
              onClick={onPlayAgain}
            >
              <PixelIcon name="play" />
              <span>Play Again</span>
            </button>
            <button type="button" className="nes-btn win-btn" onClick={onHome}>
              <PixelIcon name="home" />
              <span>Home</span>
            </button>
          </div>
        </div>

        <CaughtTray
          caught={result.caught}
          newlyCaught={result.newlyCaught}
          pokedexCount={result.pokedexCount}
        />
      </div>
    </div>
  );
};

export default WinScreen;
