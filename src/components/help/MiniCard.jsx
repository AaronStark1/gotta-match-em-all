import { useState } from "react";
import CardFace from "../CardFace";
import { spriteUrl } from "../../config/api";

/**
 * Lightweight, non-interactive card for the rules diagram: not the game's
 * interactive <Card>, but the same <CardFace>, so it looks just like one.
 * Render it inside an aria-hidden wrapper: it is art.
 *
 * - face down: the real card-back art
 * - face up:   the board's card face (Dex / GEN, framed sprite, name banner)
 * - matched:   face up with a gold pixel glow
 */
const MiniCard = ({
  faceUp = false,
  matched = false,
  dexId = 25,
  name = "",
  spriteFit = null,
  className = "",
}) => {
  const [spriteFailed, setSpriteFailed] = useState(false);
  const classes = ["help-mini", faceUp ? "is-face" : "is-back"];
  if (matched) classes.push("is-matched");
  if (className) classes.push(className);

  if (!faceUp) return <span className={classes.join(" ")} />;

  return (
    <span className={classes.join(" ")}>
      <CardFace
        pokemon={{
          id: dexId,
          name,
          image: spriteUrl(dexId),
          imageFailed: spriteFailed,
          spriteFit,
          cors: false,
        }}
        onImageError={() => setSpriteFailed(true)}
      />
    </span>
  );
};

export default MiniCard;
