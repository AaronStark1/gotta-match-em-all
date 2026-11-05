import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LandingPage.css";
import DifficultySelector from "../components/DifficultySelector";
import SoundToggle from "../components/SoundToggle";
import { getPreferredDifficulty, setPreferredDifficulty } from "../utils/preferences";
import { getBestRecord } from "../utils/records";
import { DIFFICULTIES } from "../config/difficulty";
import { formatTime } from "../utils/format";

const LandingPage = () => {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState(getPreferredDifficulty);
  const best = getBestRecord(difficulty);

  const handleDifficultyChange = (next) => {
    setDifficulty(next);
    setPreferredDifficulty(next);
  };

  return (
    <section className="container">
      <div className="landing-sound">
        <SoundToggle />
      </div>

      <div className="centering">
        <h1>Gotta Match'Em All!</h1>

        <div className="nes-container is-dark is-rounded landing-panel">
          <DifficultySelector value={difficulty} onChange={handleDifficultyChange} />
          <div aria-live="polite" aria-atomic="true">
            <span className="visually-hidden">{DIFFICULTIES[difficulty].label} records:</span>
            <dl className="landing-best">
              <div>
                <dt>Best Score:</dt>
                <dd className="nes-text is-warning">{best.score ?? "---"}</dd>
              </div>
              <div>
                <dt>Best Time:</dt>
                <dd className="nes-text is-warning">
                  {best.time === null ? "--:--" : formatTime(best.time)}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="landing-buttons">
          <button
            type="button"
            className="nes-btn is-warning"
            onClick={() => navigate(`/play?difficulty=${difficulty}`)}
          >
            <span className="press-start">Start Game</span>
          </button>

          <button type="button" className="nes-btn is-primary help-btn" onClick={() => navigate("/help")}>
            Help
          </button>
        </div>

        <p className="api-credit">
          Source API{" "}
          <a className="link" href="https://pokeapi.co" target="_blank" rel="noopener noreferrer">
            here
          </a>
        </p>
      </div>

      <div className="footer">
        <span>&copy; {new Date().getFullYear()} aaronstark1</span>
        <i className="nes-pokeball pokeball-loader" aria-hidden="true"></i>
        <span>Want to check the repo?</span>
        <a
          className="link"
          href="https://github.com/AaronStark1"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="AaronStark1 on GitHub"
        >
          <i className="nes-icon github is-medium" aria-hidden="true"></i>
        </a>
      </div>
    </section>
  );
};

export default LandingPage;
