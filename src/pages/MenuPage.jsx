import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/LandingPage.css";
import DifficultySelector from "../components/DifficultySelector";
import SystemToggles from "../components/SystemToggles";
import ArcadeLogo from "../components/landing/ArcadeLogo";
import FloatingAccents from "../components/landing/FloatingAccents";
import HallOfFame from "../components/landing/HallOfFame";
import useBackdropStyle from "../components/landing/useBackdropStyle";
import PixelSprite from "../components/pixel/PixelSprite";
import { HELP_ICON } from "../components/landing/sprites";
import { PLAY_ICON } from "../components/pixel/glyphs";
import { getPreferredDifficulty, setPreferredDifficulty } from "../utils/preferences";

const PAGE_TITLE = "Main Menu | Gotta Match' Em All!";

/**
 * Main menu, reached from the title screen's PRESS START: difficulty, Hall of
 * Fame records, Start Game and Help.
 */
const MenuPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [difficulty, setDifficulty] = useState(getPreferredDifficulty);
  const backdropStyle = useBackdropStyle();
  const startRef = useRef(null);
  const cameFromTitle = Boolean(location.state?.fromTitle);

  useEffect(() => {
    const previous = document.title;
    document.title = PAGE_TITLE;
    return () => {
      document.title = previous;
    };
  }, []);

  // PRESS START unmounted with the title screen: carry keyboard focus on to
  // Start Game, so Enter, Enter starts a game like an arcade cabinet.
  useEffect(() => {
    if (cameFromTitle) startRef.current?.focus();
  }, [cameFromTitle]);

  const handleDifficultyChange = (next) => {
    setDifficulty(next);
    setPreferredDifficulty(next);
  };

  return (
    <div className="landing landing--menu" style={backdropStyle}>
      <FloatingAccents />

      <header className="landing-topbar">
        <button
          type="button"
          className="nes-btn landing-back"
          onClick={() => navigate("/")}
          aria-label="Back to the title screen"
        >
          <PixelSprite sprite={PLAY_ICON} pixelSize={2} className="landing-btn-icon landing-back-icon" />
          <span className="landing-back-text">Back</span>
        </button>
        <SystemToggles />
      </header>

      <main className="landing-main">
        <ArcadeLogo />

        <div className="landing-menu">
          <div className="nes-container is-dark with-title is-centered landing-panel">
            <h2 className="title">Select Difficulty</h2>
            <DifficultySelector value={difficulty} onChange={handleDifficultyChange} hideLabel />
          </div>

          <HallOfFame difficulty={difficulty} />
        </div>

        <div className="landing-actions">
          <button
            ref={startRef}
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
    </div>
  );
};

export default MenuPage;
