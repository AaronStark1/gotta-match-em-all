import { useNavigate } from "react-router-dom";
import "../styles/HelpPage.css";
import pokeballIcon from "../assets/poke-ball.png";

const HelpPage = () => {
  const navigate = useNavigate();

  return (
    <div className="help-wrapper">
      <div className="help-container nes-container is-dark with-title is-rounded">
        <h1 className="help-title">
          <img src={pokeballIcon} alt="" className="help-icon" />
          How to Play
        </h1>

        <div className="help-content">
          <p className="intro-text">
            Welcome, Trainer! Test your memory and catch 'em all!
          </p>

          <ul className="help-list">
            <li>🃏 The game board has hidden Pokémon cards.</li>
            <li>🎚️ Pick Easy (3x4), Medium (4x4) or Hard (4x5) before you play.</li>
            <li>🔍 Flip two cards each turn to find a matching pair.</li>
            <li>✅ If they match, they stay revealed — earn <b>+100 points!</b></li>
            <li>❌ If not, they flip back — lose <b>20 points</b> (your score never drops below 0).</li>
            <li>⏱️ The clock starts on your first flip. Beat your best score and best time!</li>
            <li>⌨️ Use Tab or the arrow keys to move, and Enter or Space to flip.</li>
            <li>🔊 Toggle sound any time with the speaker button.</li>
          </ul>

          <p className="tip-text">
            Tip: Concentrate, Trainer — Legendary Pokémon might appear!
          </p>

          <div className="help-buttons">
            <button type="button" className="nes-btn is-primary" onClick={() => navigate("/")}>
              Home
            </button>
            <button type="button" className="nes-btn is-success" onClick={() => navigate("/play")}>
              Start Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
