import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/PageNotFound.css";
import wobbleSfx from "../assets/sounds/pokeball-wobble-404.mp3";
import openingPokeball from "../assets/gifs/opening-pokeball.gif";

const PageNotFound = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const audio = new Audio(wobbleSfx);
    audio.volume = 0.45;
    audio.loop = true;

    const startAudio = () => {
      audio.play().catch(() => {});
      window.removeEventListener("pointerdown", startAudio);
    };

    window.addEventListener("pointerdown", startAudio);

    return () => {
      audio.pause();
      audio.currentTime = 0;
      window.removeEventListener("pointerdown", startAudio);
    };
  }, []);

  return (
    <div className="nf-wrapper">
      <div className="nf-content">

        <div className="nf-404">
          <span>4</span>
          <img src={openingPokeball} alt="Pokeball Opening" className="nf-pokeball" />
          <span>4</span>
        </div>

        <p className="nf-text">
          The path you chose leads nowhere, Trainer...
        </p>

        <div className="nf-buttons">
          <button className="nes-btn is-primary" onClick={() => navigate("/")}>
            Home
          </button>
          <button className="nes-btn is-error" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>

      </div>
    </div>
  );
};

export default PageNotFound;
