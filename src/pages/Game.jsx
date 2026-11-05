import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../styles/Game.css";
import Card from "../components/Card";
import ScoreBoard from "../components/ScoreBoard";
import Loader from "../components/Loader";
import WinScreen from "../components/WinScreen";
import RetroErrorBox from "../components/RetroErrorBox";
import SystemToggles from "../components/SystemToggles";
import DifficultySelector from "../components/DifficultySelector";
import usePokemonGame from "../game/usePokemonGame";
import useSound from "../audio/useSound";
import useReducedMotion, { useStillFrame } from "../display/useReducedMotion";
import { pickBackground } from "../config/backgrounds";
import { isDifficulty } from "../config/difficulty";
import { getPreferredDifficulty, setPreferredDifficulty } from "../utils/preferences";
import victoryCheerGif from "../assets/gifs/pikacheer.gif";

const LOADER_FADE_MS = 600;

/**
 * Number of columns the grid actually renders (small phones re-flow Hard to
 * 4), or null if it can't be read (e.g. the grid isn't laid out).
 */
function renderedColumns(grid) {
  const tracks = getComputedStyle(grid).gridTemplateColumns;
  if (!tracks || tracks === "none" || tracks.includes("(")) return null;
  return tracks.trim().split(/\s+/).length;
}

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
  const [headerHeight, setHeaderHeight] = useState(null);
  const [gridColumns, setGridColumns] = useState(null);
  const gridRef = useRef(null);
  const pendingFocusRef = useRef(null); // element to refocus once the next board is ready

  // The board backgrounds are looping GIFs: with reduced motion, show a still
  // first frame instead (plain dark backdrop until it's ready).
  const reducedMotion = useReducedMotion();
  const stillBackground = useStillFrame(background, reducedMotion);
  let backgroundImage = `url(${background})`;
  if (reducedMotion) backgroundImage = stillBackground ? `url(${stillBackground})` : "none";

  // Warm up sound effects so the first match plays instantly.
  useEffect(() => {
    preload(["match", "victory"]);
  }, [preload]);

  // Silence the board when leaving it: the victory theme and the ~4s match jingle.
  useEffect(
    () => () => {
      stop("victory");
      stop("match");
    },
    [stop]
  );

  // Fetch the win screen's Pikachu while the player is busy, so it's there instantly.
  useEffect(() => {
    if (status !== "playing") return;
    const image = new Image();
    image.src = victoryCheerGif;
  }, [status]);

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

  // Measure the header (logo + console bar, which wraps on narrow screens) so
  // CSS can size the board to fit the remaining viewport height.
  const measureHeader = useCallback((node) => {
    if (!node) return undefined;
    const update = () => setHeaderHeight(Math.ceil(node.getBoundingClientRect().height));
    update();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Track the grid's rendered column count (it changes when Hard re-flows on
  // small phones) so its accessible "rows by columns" description stays true.
  const attachGrid = useCallback((node) => {
    gridRef.current = node;
    if (!node) return undefined;
    const update = () => setGridColumns(renderedColumns(node));
    update();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => {
      observer.disconnect();
      gridRef.current = null;
    };
  }, []);

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

  // Arrow keys move focus around the grid (Tab also works). Columns are read
  // from the rendered grid because small phones re-flow Hard to 4 columns.
  const handleGridKeyDown = useCallback(
    (event) => {
      const grid = gridRef.current;
      if (!grid) return;
      const columns = renderedColumns(grid) || config.cols;
      const steps = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns };
      const step = steps[event.key];
      if (!step) return;
      const current = event.target.closest("[data-index]");
      if (!current) return;
      const buttons = grid.querySelectorAll("[data-index]");
      const next = Number(current.dataset.index) + step;
      if (next < 0 || next >= buttons.length) return;
      event.preventDefault();
      buttons[next].focus();
    },
    [config.cols]
  );

  const boardColumns = gridColumns || config.cols;
  const boardRows = Math.ceil((config.rows * config.cols) / boardColumns);

  // Floating "+100" / "-20" next to the score, keyed by move so each one replays.
  const scorePopup =
    lastEvent && (lastEvent.type === "match" || lastEvent.type === "mismatch") && lastEvent.delta
      ? { delta: lastEvent.delta, key: `${game.gameId}-${lastEvent.moves}` }
      : null;

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
        style={{
          backgroundImage,
          "--header-h": headerHeight ? `${headerHeight}px` : undefined,
        }}
        aria-busy={isLoading}
      >
        <header className="game-header" ref={measureHeader}>
          <h1 className="game-title">Gotta Match' Em All!</h1>

          <div className="game-controls" inert={hiddenWhileLoading}>
            <button type="button" className="nes-btn is-primary" onClick={goHome}>
              <span className="btn-icon" aria-hidden="true">
                🏠
              </span>
              <span className="btn-label">Home</span>
            </button>
            <button type="button" className="nes-btn is-error" onClick={handleReset}>
              <span className="btn-icon" aria-hidden="true">
                🔄
              </span>
              <span className="btn-label">Reset</span>
            </button>
            <SystemToggles />
            <DifficultySelector value={difficulty} onChange={handleDifficultyChange} compact />
          </div>
        </header>

        <div
          className="playfield"
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
            popup={scorePopup}
          />

          <div
            ref={attachGrid}
            className={`grid cols-${config.cols}`}
            role="group"
            aria-label={`${config.label} board, ${boardRows} rows by ${boardColumns} columns`}
            aria-describedby="grid-help"
            onKeyDown={handleGridKeyDown}
          >
            {cards.map((card, index) => (
              <Card
                key={`${game.gameId}-${card.uniqueId}`}
                card={card}
                index={index}
                mismatched={game.locked && game.flipped.includes(card.uniqueId)}
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
