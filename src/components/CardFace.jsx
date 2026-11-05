import pokeballFallback from "../assets/poke-ball.png";
import { formatDexNumber, generationLabel } from "../utils/format";
import "../styles/CardFace.css";

/**
 * The face-up side of a card: Dex number + generation badge, the sprite in an
 * inset pixel frame (zoomed onto the creature when `spriteFit` was measured)
 * and a name banner. Shared by the board's cards and the Help page's
 * card-flip diagram. Purely visual: render it inside an aria-hidden wrapper.
 *
 * pokemon: { id, name, image, imageFailed, spriteFit, cors }
 */
const CardFace = ({ pokemon, className = "", onImageError }) => {
  const { id, name, image, imageFailed, spriteFit, cors } = pokemon;
  const classes = ["card-face"];
  if (imageFailed) classes.push("is-fallback");
  if (className) classes.push(className);

  return (
    <span className={classes.join(" ")}>
      <span className="card-header">
        <span className="card-dex">{formatDexNumber(id)}</span>
        <span className="card-gen">GEN {generationLabel(id)}</span>
      </span>
      <span className="card-frame">
        {imageFailed ? (
          <img className="card-sprite is-fallback" src={pokeballFallback} alt="" draggable="false" />
        ) : (
          <img
            className="card-sprite"
            src={image}
            alt=""
            draggable="false"
            // Same request mode as the preload, so the decoded image is reused
            crossOrigin={cors ? "anonymous" : undefined}
            style={
              spriteFit
                ? {
                    "--sprite-k": spriteFit.k,
                    "--sprite-cx": spriteFit.cx,
                    "--sprite-cy": spriteFit.cy,
                  }
                : undefined
            }
            onError={onImageError}
          />
        )}
      </span>
      {/* --chars lets the banner shrink long names to one line on small cards */}
      <span className="card-name" style={{ "--chars": Math.max(1, name.length) }}>
        {name}
      </span>
    </span>
  );
};

export default CardFace;
