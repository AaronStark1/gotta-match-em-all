import React, { useEffect, useState } from "react";
import "../styles/ScoreBoard.css";

const ScoreBoard = ({ score, turns }) => {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (score > 0) {
      setPulse(true);
      const timeout = setTimeout(() => setPulse(false), 600);
      return () => clearTimeout(timeout);
    }
  }, [score]);

  return (
    <div
      className={`scoreboard  nes-container is-rounded is-dark ${
        pulse ? "pulse" : ""
      }`}
    >
      <p>
        <strong>Score:</strong>{" "}
        <span className="nes-text is-warning">{score}</span>
      </p>
      <p>
        <strong>Turns:</strong>{" "}
        <span className="nes-text is-success">{turns}</span>
      </p>
    </div>
  );
};

export default ScoreBoard;
