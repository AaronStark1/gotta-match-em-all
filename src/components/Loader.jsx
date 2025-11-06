// src/components/Loader.jsx
import React from "react";
import "../styles/Loader.css";

const Loader = ({ fading }) => {
  return (
    <div className={`loader-overlay ${fading ? "fade-out" : ""}`}>
      <div className="loader-content">
        <div className="pokeball"></div>
        <p className="loading-text">Catching Pokémon...</p>
      </div>
    </div>
  );
};

export default Loader;
