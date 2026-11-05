import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LandingPage.css";
import DifficultySelector from "../components/DifficultySelector";
import SystemToggles from "../components/SystemToggles";
import FloatingAccents from "../components/landing/FloatingAccents";
import HallOfFame from "../components/landing/HallOfFame";
import PixelSprite from "../components/pixel/PixelSprite";
import { HELP_ICON, SPARKLE_SMALL } from "../components/landing/sprites";
import { PLAY_ICON, SPARKLE } from "../components/pixel/glyphs";
import useReducedMotion, { useStillFrame } from "../display/useReducedMotion";
import { getPreferredDifficulty, setPreferredDifficulty } from "../utils/preferences";
import pokeGroupGif from "../assets/gifs/poke-group.gif";

const LandingPage = () => {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState(getPreferredDifficulty);
  // Reduced motion: the CSS backdrop swaps its looping GIF for this still frame.
  const reducedMotion = useReducedMotion();
  const stillBackdrop = useStillFrame(pokeGroupGif, reducedMotion);

  const handleDifficultyChange = (next) => {
    setDifficulty(next);
    setPreferredDifficulty(next);
  };

  return (
    <div
      className="landing"
      style={stillBackdrop ? { "--landing-still": `url(${stillBackdrop})` } : undefined}
    >
      <FloatingAccents />

      <header className="landing-topbar">
        <SystemToggles />
      </header>

      <main className="landing-main">
        <div className="landing-hero">
          <div className="landing-logo-wrap">
            <h1 className="landing-logo">
              <span className="landing-logo-line">Gotta Match</span>{" "}
              <span className="landing-logo-line">'Em All!</span>
            </h1>
            <PixelSprite sprite={SPARKLE} pixelSize={3} className="landing-glint landing-glint--a" />
            <PixelSprite sprite={SPARKLE_SMALL} pixelSize={3} className="landing-glint landing-glint--b" />
          </div>
          <p className="landing-subtitle">
            <span className="landing-subtitle-star" aria-hidden="true">★</span> 8-BIT MEMORY ARCADE{" "}
            <span className="landing-subtitle-star" aria-hidden="true">★</span>
          </p>
        </div>

        <div className="landing-menu">
          <div className="nes-container is-dark with-title is-centered landing-panel">
            <h2 className="title">Select Difficulty</h2>
            <DifficultySelector value={difficulty} onChange={handleDifficultyChange} hideLabel />
          </div>

          <HallOfFame difficulty={difficulty} />
        </div>

        <div className="landing-actions">
          <button
            type="button"
            className="nes-btn is-warning landing-btn landing-start"
            onClick={() => navigate(`/play?difficulty=${difficulty}`)}
          >
            <span className="landing-start-glow" aria-hidden="true" />
            <PixelSprite sprite={PLAY_ICON} pixelSize={2} className="landing-btn-icon" />
            <span>Start Game</span>
          </button>

          <button
            type="button"
            className="nes-btn is-primary landing-btn landing-help"
            onClick={() => navigate("/help")}
          >
            <PixelSprite sprite={HELP_ICON} pixelSize={2} className="landing-btn-icon" />
            <span>Help</span>
          </button>
        </div>

        <p className="landing-credit">
          Pokémon data from{" "}
          <a className="landing-link" href="https://pokeapi.co" target="_blank" rel="noopener noreferrer">
            PokéAPI<span className="visually-hidden"> (opens in a new tab)</span>
          </a>
        </p>
      </main>

      <footer className="landing-footer">
        <p className="landing-footer-text">&copy; {new Date().getFullYear()} aaronstark1</p>
        <span className="landing-footer-ball" aria-hidden="true">
          <span className="landing-footer-ball-hop">
            <i className="nes-pokeball"></i>
          </span>
        </span>
        <p className="landing-footer-text landing-footer-repo">
          <span>Want to check the repo?</span>
          <a
            className="landing-github"
            href="https://github.com/AaronStark1"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="AaronStark1 on GitHub (opens in a new tab)"
          >
            <i className="nes-icon github is-medium" aria-hidden="true"></i>
          </a>
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
