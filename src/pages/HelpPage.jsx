import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/HelpPage.css";
import pokeballIcon from "../assets/poke-ball.png";

const HelpPage = () => {
  const navigate = useNavigate();

  return (
    <div className="help-wrapper">
      <div className="help-container nes-container is-dark with-title is-rounded">
        <h1 className="help-title">
          <img src={pokeballIcon} alt="Pokeball" className="help-icon" />
          How to Play
        </h1>

        <div className="help-content">
          <p className="intro-text">
            Welcome, Trainer! Test your memory and catch 'em all!
          </p>

          <ul className="help-list">
            <li>🃏 The game board has hidden Pokémon cards.</li>
            <li>🔍 Flip two cards each turn to find a matching pair.</li>
            <li>✅ If they match, they stay revealed — earn <b>+100 points!</b></li>
            <li>❌ If not, they flip back — lose <b>20 points.</b></li>
            <li>💡 Try to finish the game in the fewest turns possible!</li>
          </ul>

          <p className="tip-text">
            Tip: Concentrate, Trainer — Legendary Pokémon might appear!
          </p>

          <div className="help-buttons">
            <button className="nes-btn is-primary" onClick={() => navigate("/")}>
              Home
            </button>
            <button className="nes-btn is-success" onClick={() => navigate("/play")}>
              Start Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
