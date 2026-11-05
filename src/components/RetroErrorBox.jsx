import { useEffect, useId, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Controls.css";

/** Full-screen NES-style error dialog with Retry / Home actions. */
const RetroErrorBox = ({
  title = "Oh no! The Pokémon broke free!",
  message = "Something went wrong.",
  onRetry,
  retryLabel = "Retry",
  onHome,
}) => {
  const navigate = useNavigate();
  const retryRef = useRef(null);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    retryRef.current?.focus();
  }, []);

  return (
    <div className="retro-error-screen">
      <section
        className="nes-container is-dark is-rounded with-title retro-error"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
      >
        <p className="title">Error!</p>
        <i className="nes-pokeball retro-error-icon" aria-hidden="true"></i>
        <h2 id={titleId} className="retro-error-title">
          {title}
        </h2>
        <p id={messageId} className="retro-error-message nes-text is-error">
          {message}
        </p>
        <div className="retro-error-buttons">
          <button ref={retryRef} type="button" className="nes-btn is-warning" onClick={onRetry}>
            {retryLabel}
          </button>
          <button
            type="button"
            className="nes-btn is-primary"
            onClick={() => (onHome ? onHome() : navigate("/"))}
          >
            Home
          </button>
        </div>
      </section>
    </div>
  );
};

export default RetroErrorBox;
