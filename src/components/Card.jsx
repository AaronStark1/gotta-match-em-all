import React from "react";
import "../styles/Game.css"; // same stylesheet for consistency

const Card = ({ card, onClick }) => {
  return (
    <div
      className={`card ${card.flipped ? "flipped" : ""}`}
      onClick={() => onClick && onClick(card.uniqueId)}
    >
      <div className="card-inner">
        <div className="card-front"></div>
        <div className="card-back">
          <img src={card.image} alt={card.name} />
        </div>
      </div>
    </div>
  );
};

export default Card;
