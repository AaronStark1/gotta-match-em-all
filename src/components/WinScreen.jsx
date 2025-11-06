import React, { useEffect, useRef } from "react";
import "../styles/WinScreen.css";
import pikachuWin from "../assets/gifs/pikacheer.gif";
import confetti from "canvas-confetti";

const WinScreen = ({ score, turns }) => {
  const confettiRef = useRef(null);

  // Create Pokéball Shape from SVG Path
// TRUE Pokéball SVG Path
const pokeballShape = confetti.shapeFromPath({
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
  matrix: [
    0.04, 0,
    0, 0.04,
    -10, -10
  ],
});


  // Create Confetti Canvas
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

    document.body.appendChild(canvas);

    const myConfetti = confetti.create(canvas, {
      resize: true,
      useWorker: false, // REQUIRED for custom shapes
    });

    confettiRef.current = { myConfetti, canvas };

    return () => {
      myConfetti.reset();
      canvas.remove();
    };
  }, []);



  // Run Pokéball Confetti
useEffect(() => {
  if (!confettiRef.current) return;
  const { myConfetti } = confettiRef.current;

  // BIG WIN BURST
  myConfetti({
    particleCount: 140,
    spread: 160,
    startVelocity: 35,
    origin: { y: 0.6 },
    shapes: [pokeballShape],
    colors: ["#ff0000", "#ffffff", "#000000", "#ffcb05"],
    scalar: 1.9,
  });

  // Continuous celebration drizzle
  const drizzle = setInterval(() => {
    myConfetti({
      particleCount: 22,
      spread: 180,
      startVelocity: 18,
      decay: 0.92,
      origin: { x: Math.random(), y: 0 },
      shapes: [pokeballShape],
      colors: ["#ff0000", "#ffffff", "#000000", "#ffcb05"],
      scalar: 1.6,
    });
  }, 200);

  setTimeout(() => clearInterval(drizzle), 2400);
}, []);


  return (
    <div className="win-overlay">
      <div className="win-box">
        <h1 className="win-title">🎉 You Win! 🎉</h1>

        <img src={pikachuWin} alt="Pikachu Celebrate" className="pikachu" />

        <p className="win-stat"><span>Score:</span> {score}</p>
        <p className="win-stat"><span>Turns:</span> {turns}</p>

        <button className="nes-btn is-error" onClick={() => window.location.reload()}>
          Play Again
        </button>
        <button className="nes-btn" onClick={() => window.location.href = "/"}>
          Home
        </button>
      </div>
    </div>
  );
};

export default WinScreen;
