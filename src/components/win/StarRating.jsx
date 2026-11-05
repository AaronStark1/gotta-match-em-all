import { MAX_STARS } from "../../game/rating";
import { pluralize, retroCaps } from "./winHelpers";

/**
 * 1-3 nes.css pixel stars. Every slot shows an empty star socket; earned
 * stars stamp in on top of it one by one (static with reduced motion).
 * Screen readers get one sentence instead of three icons.
 */
const StarRating = ({ id, rating, moves }) => {
  const earned = Math.min(MAX_STARS, Math.max(0, Math.round(rating.stars) || 0));
  const { title, minimumMoves } = rating;

  return (
    <div id={id} className="win-rating">
      <p className="visually-hidden">{`Rating: ${earned} of ${MAX_STARS} stars, ${title}.`}</p>

      <div className="win-stars" aria-hidden="true">
        {Array.from({ length: MAX_STARS }, (_, index) => {
          const isEarned = index < earned;
          return (
            <span
              key={index}
              className={`win-star${isEarned ? " is-earned" : ""}`}
              style={{ "--star-index": index }}
            >
              <i className="nes-icon is-large star is-empty" />
              {isEarned && (
                <span className="win-star-pop">
                  <i className="nes-icon is-large star" />
                </span>
              )}
            </span>
          );
        })}
      </div>

      <p className="win-rank" aria-hidden="true">
        {retroCaps(title)}
      </p>
      <p className="win-moves">
        <span className="win-nowrap">{pluralize(moves, "move")}</span>
        <span aria-hidden="true"> · </span>
        <span className="visually-hidden">, </span>
        <span className="win-nowrap">best possible {minimumMoves}</span>
      </p>
    </div>
  );
};

export default StarRating;
