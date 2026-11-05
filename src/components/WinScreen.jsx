import { useEffect, useId, useRef } from "react";
import confetti from "canvas-confetti";
import pikachuWin from "../assets/gifs/pikacheer.gif";
import { boardSizeLabel } from "../config/difficulty";
import { formatTime } from "../utils/format";
import "../styles/WinScreen.css";

const CONFETTI_COLORS = ["#ff0000", "#ffffff", "#000000", "#ffcb05"];

// Built lazily on first win (not at module load) and reused afterwards.
let pokeballShape = null;
function getPokeballShape() {
  if (!pokeballShape) {
    pokeballShape = confetti.shapeFromPath({
      path: `
        M256 32C132.3 32 32 132.3 32 256s100.3 224 224 224
        224-100.3 224-224S379.7 32 256 32zm0 48
        c97.2 0 176 78.8 176 176h-160v-48h-32v48H80
        c0-97.2 78.8-176 176-176zm0 352
        c-97.2 0-176-78.8-176-176h160v48h32v-48h160
        c0 97.2-78.8 176-176 176zm0-224
        c-26.5 0-48 21.5-48 48s21.5 48 48 48
        48-21.5 48-48-21.5-48-48-48z
      `,
      matrix: [0.04, 0, 0, 0.04, -10, -10],
    });
  }
  return pokeballShape;
}

const NewBestBadge = () => (
  <span className="nes-badge new-best">
    <span className="is-warning">New Best!</span>
  </span>
);

const WinScreen = ({ result, difficulty, onPlayAgain, onHome }) => {
  const playAgainRef = useRef(null);
  const titleId = useId();
  const statsId = useId();

  useEffect(() => {
    playAgainRef.current?.focus();
  }, []);

  // Pokéball confetti on its own canvas, fully cleaned up on unmount.
  useEffect(() => {
    const canvas = document.createElement("canvas");
    Object.assign(canvas.style, {
      position: "fixed",
      inset: 0,
      width: "100vw",
      height: "100vh",
      pointerEvents: "none",
      zIndex: 99999999,
    });
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);

    const myConfetti = confetti.create(canvas, {
      resize: true,
      useWorker: false, // required for custom shapes
      disableForReducedMotion: true,
    });
    const shapes = [getPokeballShape()];

    myConfetti({
      particleCount: 140,
      spread: 160,
      startVelocity: 35,
      origin: { y: 0.6 },
      shapes,
      colors: CONFETTI_COLORS,
      scalar: 1.9,
    });

    const drizzle = setInterval(() => {
      myConfetti({
        particleCount: 22,
        spread: 180,
        startVelocity: 18,
        decay: 0.92,
        origin: { x: Math.random(), y: 0 },
        shapes,
        colors: CONFETTI_COLORS,
        scalar: 1.6,
      });
    }, 200);
    const stopDrizzle = setTimeout(() => clearInterval(drizzle), 2400);

    return () => {
      clearInterval(drizzle);
      clearTimeout(stopDrizzle);
      myConfetti.reset();
      canvas.remove();
    };
  }, []);

  const { score, moves, time, previousBest, isNewBestScore, isNewBestTime } = result;
  const bestScore = isNewBestScore ? score : previousBest.score;
  const bestTime = isNewBestTime ? time : previousBest.time;

  return (
    <div className="win-overlay">
      <div
        className="win-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={statsId}
      >
        <h1 id={titleId} className="win-title">
          🎉 You Win! 🎉
        </h1>

        <img src={pikachuWin} alt="Pikachu celebrating" className="pikachu" />

        <div id={statsId}>
          <p className="win-mode">
            <span className="nes-badge win-badge">
              <span className="is-warning">{difficulty.label}</span>
            </span>
            <span className="win-size">{boardSizeLabel(difficulty)}</span>
          </p>

          <p className="win-stat">
            <span>Score:</span> {score}
            {isNewBestScore && <NewBestBadge />}
          </p>
          <p className="win-stat">
            <span>Moves:</span> {moves}
          </p>
          <p className="win-stat">
            <span>Time:</span> {formatTime(time)}
            {isNewBestTime && <NewBestBadge />}
          </p>
          <p className="win-stat win-best">
            <span>Best:</span> {bestScore} pts / {formatTime(bestTime)}
          </p>
        </div>

        <button ref={playAgainRef} type="button" className="nes-btn is-error" onClick={onPlayAgain}>
          Play Again
        </button>
        <button type="button" className="nes-btn" onClick={onHome}>
          Home
        </button>
      </div>
    </div>
  );
};

export default WinScreen;
