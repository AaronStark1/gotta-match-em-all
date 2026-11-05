import { memo } from "react";
import CardFace from "./CardFace";
import "../styles/Game.css";

/**
 * A native <button> so Tab / Enter / Space work out of the box. The visual
 * card faces are aria-hidden; the button's label carries the real state so
 * screen readers never hear a face-down card's Pokémon.
 *
 * DOM: button.card > .card-body (lift + shake) > .card-inner (3D flip)
 *        > .card-front (face-down TCG back) + .card-back (the shared CardFace)
 */
const Card = ({ card, index, mismatched = false, onFlip, onImageError }) => {
  const faceUp = card.flipped || card.matched;
  const position = index + 1;
  const label = !faceUp
    ? `Card ${position}: face down`
    : `Card ${position}: ${card.name}${card.matched ? ", matched" : ""}`;

  const classes = ["card"];
  if (faceUp) classes.push("flipped");
  if (card.matched) classes.push("matched");
  if (mismatched) classes.push("is-mismatch");

  return (
    <button
      type="button"
      className={classes.join(" ")}
      data-index={index}
      data-pokemon-id={card.id}
      aria-label={label}
      aria-disabled={faceUp || undefined}
      onClick={() => onFlip(card.uniqueId)}
    >
      <span className="card-body" aria-hidden="true">
        <span className="card-inner">
          <span className="card-front" />
          <CardFace pokemon={card} className="card-back" onImageError={() => onImageError(card.id)} />
        </span>

        {card.matched && (
          <span className="card-sparkles">
            <span className="sparkle sparkle-1" />
            <span className="sparkle sparkle-2" />
            <span className="sparkle sparkle-3" />
            <span className="sparkle sparkle-4" />
          </span>
        )}
      </span>
    </button>
  );
};

export default memo(Card);
