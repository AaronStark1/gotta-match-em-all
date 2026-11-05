import { MAX_STARS } from "../../game/rating";

/**
 * `stars` filled nes.css stars followed by empty ones, up to MAX_STARS.
 * Filled and empty stars differ in shape (solid vs outline), not just colour.
 * Announced as "N of 3 stars" unless `decorative` (when nearby text says it).
 */
const StarRow = ({ stars, small = false, decorative = false, className = "" }) => {
  const a11y = decorative
    ? { "aria-hidden": true }
    : { role: "img", "aria-label": `${stars} of ${MAX_STARS} stars` };

  return (
    <span className={`help-stars ${small ? "is-small" : ""} ${className}`} {...a11y}>
      {Array.from({ length: MAX_STARS }, (_, index) => (
        <i
          key={index}
          className={`nes-icon star ${small ? "is-small" : ""} ${index < stars ? "" : "is-empty"}`}
        />
      ))}
    </span>
  );
};

export default StarRow;
