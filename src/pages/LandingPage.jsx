import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LandingPage.css";
import SystemToggles from "../components/SystemToggles";
import ArcadeLogo from "../components/landing/ArcadeLogo";
import useBackdropStyle from "../components/landing/useBackdropStyle";
import PixelSprite from "../components/pixel/PixelSprite";
import { PLAY_ICON } from "../components/pixel/glyphs";

/**
 * Title screen: the breathing wallpaper, the arcade logo and PRESS START.
 * Everything else (difficulty, records, help) lives on the main menu.
 */
const LandingPage = () => {
  const navigate = useNavigate();
  const backdropStyle = useBackdropStyle();

  const pressStart = useCallback(() => navigate("/menu", { state: { fromTitle: true } }), [navigate]);

  // Arcade-style: Enter anywhere on the title screen counts as PRESS START.
  // (A focused button or link handles its own Enter, so only bare keypresses count.)
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== "Enter" || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target !== document.body && event.target !== document.documentElement) return;
      event.preventDefault();
      pressStart();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pressStart]);

  return (
    <div className="landing landing--title" style={backdropStyle}>
      <header className="landing-topbar">
        <SystemToggles />
      </header>

      <main className="landing-main">
        <ArcadeLogo />

        <button type="button" className="nes-btn is-warning landing-btn landing-start" onClick={pressStart}>
          <span className="landing-start-glow" aria-hidden="true" />
          <PixelSprite sprite={PLAY_ICON} pixelSize={2} className="landing-btn-icon" />
          <span>Press Start</span>
        </button>
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
