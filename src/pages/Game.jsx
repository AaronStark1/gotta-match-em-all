import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../styles/Game.css";
import Card from "../components/Card";
import ScoreBoard from "../components/ScoreBoard";
import Loader from "../components/Loader";
import WinScreen from "../components/WinScreen";
import RetroErrorBox from "../components/RetroErrorBox";
import SoundToggle from "../components/SoundToggle";
import DifficultySelector from "../components/DifficultySelector";
import usePokemonGame from "../game/usePokemonGame";
import useSound from "../audio/useSound";
import { pickBackground } from "../config/backgrounds";
import { isDifficulty } from "../config/difficulty";
import { getPreferredDifficulty, setPreferredDifficulty } from "../utils/preferences";

const LOADER_FADE_MS = 600;

const Game = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [fallbackDifficulty] = useState(getPreferredDifficulty);
  const requestedDifficulty = searchParams.get("difficulty");
  const difficulty = isDifficulty(requestedDifficulty) ? requestedDifficulty : fallbackDifficulty;

  const game = usePokemonGame(difficulty);
  const { status, lastEvent, cards, config, resetGame, flipCard, reportImageError } = game;
  const { play, stop, buzz, preload } = useSound();

  const [background, setBackground] = useState(() => pickBackground());
  const [announcement, setAnnouncement] = useState("");
  const gridRef = useRef(null);
  const pendingFocusRef = useRef(null); // element to refocus once the next board is ready

  // Warm up sound effects so the first match plays instantly.
  useEffect(() => {
    preload(["match", "victory"]);
  }, [preload]);

  // Stop the victory theme when leaving the board.
  useEffect(() => () => stop("victory"), [stop]);

  // Sound effects + screen reader announcements for every game event.
  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.type === "flip") {
      setAnnouncement(`Card ${lastEvent.position}: ${lastEvent.name}.`);
    } else if (lastEvent.type === "match") {
      play("match");
      if (lastEvent.won) {
        play("victory");
        setAnnouncement(`Match! ${lastEvent.name}. All pairs found. You win!`);
      } else {
        setAnnouncement(
          `Match! ${lastEvent.name}. ${lastEvent.matchedPairs} of ${lastEvent.totalPairs} pairs found.`
        );
      }
    } else if (lastEvent.type === "mismatch") {
      buzz();
      const [first, second] = lastEvent.names;
      setAnnouncement(`No match: ${first} and ${second}. Move ${lastEvent.moves}.`);
    }
  }, [lastEvent, play, buzz]);

  // Keep the loader mounted briefly after loading so it can fade out.
  const isLoading = status === "loading";
  const [loaderMounted, setLoaderMounted] = useState(true);
  useEffect(() => {
    if (isLoading) {
      setLoaderMounted(true);
      return undefined;
    }
    const timer = setTimeout(() => setLoaderMounted(false), LOADER_FADE_MS);
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Once a requested board is ready, give keyboard focus back: to the control
  // that triggered the reload, or to the first card if that control is gone
  // (Play Again / Retry live in dialogs that unmount).
  useEffect(() => {
    if (status !== "playing" || !pendingFocusRef.current) return;
    const target = pendingFocusRef.current;
    pendingFocusRef.current = null;
    if (target instanceof HTMLElement && target.isConnected) {
      target.focus();
    } else {
      gridRef.current?.querySelector("[data-index]")?.focus();
    }
  }, [status]);

  const goHome = useCallback(() => navigate("/"), [navigate]);

  const handleReset = useCallback(() => {
    pendingFocusRef.current = document.activeElement;
    stop("victory");
    setAnnouncement("");
    setBackground((previous) => pickBackground(previous));
    resetGame();
  }, [resetGame, stop]);

  const handleDifficultyChange = useCallback(
    (next) => {
      pendingFocusRef.current = document.activeElement;
      setPreferredDifficulty(next);
      setAnnouncement("");
      setBackground((previous) => pickBackground(previous));
      setSearchParams({ difficulty: next }, { replace: true });
    },
    [setSearchParams]
  );

  // Arrow keys move focus around the grid (Tab also works).
  const handleGridKeyDown = useCallback(
    (event) => {
      const steps = {
        ArrowLeft: -1,
        ArrowRight: 1,
        ArrowUp: -config.cols,
        ArrowDown: config.cols,
      };
      const step = steps[event.key];
      if (!step || !gridRef.current) return;
      const current = event.target.closest("[data-index]");
      if (!current) return;
      const buttons = gridRef.current.querySelectorAll("[data-index]");
      const next = Number(current.dataset.index) + step;
      if (next < 0 || next >= buttons.length) return;
      event.preventDefault();
      buttons[next].focus();
    },
    [config.cols]
  );

  // A single live region that stays mounted across board / win / error views,
  // so the winning match is still announced when the win screen replaces the board.
  const liveRegion = (
    <p className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
      {announcement}
    </p>
  );

  let content;
  if (status === "error") {
    content = <RetroErrorBox message={game.error} onRetry={handleReset} onHome={goHome} />;
  } else if (status === "won" && game.result) {
    content = (
      <WinScreen result={game.result} difficulty={config} onPlayAgain={handleReset} onHome={goHome} />
    );
  } else {
    // While loading, the opaque loader covers the board: make the hidden
    // controls inert so keyboard focus can't wander through invisible buttons.
    const hiddenWhileLoading = isLoading || undefined;
    content = (
      <section
        className="game-container"
        style={{ backgroundImage: `url(${background})` }}
        aria-busy={isLoading}
      >
        <h1 className="game-title">Gotta Match' Em All!</h1>

        <div className="game-controls" inert={hiddenWhileLoading}>
          <button type="button" className="nes-btn is-primary" onClick={goHome}>
            Home
          </button>
          <button type="button" className="nes-btn is-error" onClick={handleReset}>
            Reset
          </button>
          <SoundToggle />
          <DifficultySelector value={difficulty} onChange={handleDifficultyChange} compact />
        </div>

        <div
          className="grid-wrapper"
          style={{ "--cols": config.cols, "--rows": config.rows }}
          inert={hiddenWhileLoading}
        >
          <ScoreBoard
            score={game.score}
            moves={game.moves}
            elapsed={game.elapsed}
            matchedPairs={game.matchedPairs}
            totalPairs={config.pairs}
            best={game.bestAtStart}
            difficulty={config}
          />

          <div
            ref={gridRef}
            className="grid"
            role="group"
            aria-label={`${config.label} board, ${config.rows} rows by ${config.cols} columns`}
            aria-describedby="grid-help"
            onKeyDown={handleGridKeyDown}
          >
            {cards.map((card, index) => (
              <Card
                key={`${game.gameId}-${card.uniqueId}`}
                card={card}
                index={index}
                onFlip={flipCard}
                onImageError={reportImageError}
              />
            ))}
          </div>
        </div>

        <p id="grid-help" className="visually-hidden">
          Use Tab or the arrow keys to move between cards, then press Enter or Space to flip one.
        </p>

        {(isLoading || loaderMounted) && <Loader fading={!isLoading} />}
      </section>
    );
  }

  return (
    <>
      {content}
      {liveRegion}
    </>
  );
};

export default Game;
