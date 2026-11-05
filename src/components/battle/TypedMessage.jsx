import PixelSprite from "../pixel/PixelSprite";
import { PROMPT_SPRITE } from "./trainerArt";
import "./Battle.css";

/**
 * Game Boy-style "printed" text: characters appear one by one (pure CSS, so
 * the layout never reflows), optionally followed by a blinking ▼ prompt.
 * The sentence lives in the DOM once, as visually hidden text for assistive
 * tech and copy/paste; the on-screen letters are CSS-generated (`data-char`)
 * and aria-hidden, so a surrounding live region announces it exactly once.
 * Remount (change `key`) to replay the effect.
 */
const TypedMessage = ({ text, prompt = false, className = "" }) => {
  const chars = Array.from(text);

  return (
    <p className={`typed-message ${className}`} style={{ "--typed-chars": chars.length }}>
      <span className="visually-hidden">{text}</span>
      <span className="typed-message__chars" aria-hidden="true">
        {chars.map((char, index) => (
          <span
            key={index}
            className="typed-message__char"
            data-char={char}
            style={{ "--typed-index": index }}
          />
        ))}
      </span>
      {prompt && (
        <PixelSprite className="pixel-sprite typed-message__prompt" sprite={PROMPT_SPRITE} />
      )}
    </p>
  );
};

export default TypedMessage;
