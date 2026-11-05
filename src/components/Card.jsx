import { memo } from "react";
import pokeballFallback from "../assets/poke-ball.png";
import "../styles/Game.css";

/**
 * A native <button> so Tab / Enter / Space work out of the box. The visual
 * card faces are aria-hidden; the button's label carries the real state so
 * screen readers never hear a face-down card's Pokémon.
 */
const Card = ({ card, index, onFlip, onImageError }) => {
  const faceUp = card.flipped || card.matched;
  const position = index + 1;
  const label = !faceUp
    ? `Card ${position}: face down`
    : `Card ${position}: ${card.name}${card.matched ? ", matched" : ""}`;
  const showName = card.matched || card.imageFailed;

  const classes = ["card"];
  if (faceUp) classes.push("flipped");
  if (card.matched) classes.push("matched");

  return (
    <button
      type="button"
      className={classes.join(" ")}
      data-index={index}
      aria-label={label}
      aria-disabled={faceUp || undefined}
      onClick={() => onFlip(card.uniqueId)}
    >
      <span className="card-inner" aria-hidden="true">
        <span className="card-front" />
        <span className={`card-back ${card.imageFailed ? "is-fallback" : ""}`}>
          {card.imageFailed ? (
            <img className="card-fallback-img" src={pokeballFallback} alt="" draggable="false" />
          ) : (
            <img
              src={card.image}
              alt=""
              draggable="false"
              onError={() => onImageError(card.id)}
            />
          )}
          {showName && <span className="card-name">{card.name}</span>}
        </span>
      </span>
    </button>
  );
};

export default memo(Card);
