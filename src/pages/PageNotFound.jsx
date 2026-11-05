import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/PageNotFound.css";
import openingPokeball from "../assets/gifs/opening-pokeball.gif";
import SoundToggle from "../components/SoundToggle";
import useSound from "../audio/useSound";

const PageNotFound = () => {
  const navigate = useNavigate();
  const { muted, play, stop } = useSound();

  // Loop the wobble once the browser allows audio (first tap/key press),
  // and stop it whenever sound is muted or the page is left.
  useEffect(() => {
    if (muted) return undefined;
    let cancelled = false;

    const startOnGesture = (event) => {
      // Never start the loop from a press on the mute button itself.
      if (event.target instanceof Element && event.target.closest(".sound-toggle")) return;
      removeListeners();
      if (!cancelled) play("wobble");
    };
    function removeListeners() {
      window.removeEventListener("click", startOnGesture);
      window.removeEventListener("keydown", startOnGesture);
    }

    play("wobble").then((started) => {
      if (started || cancelled) return;
      window.addEventListener("click", startOnGesture);
      window.addEventListener("keydown", startOnGesture);
    });

    return () => {
      cancelled = true;
      removeListeners();
      stop("wobble");
    };
  }, [muted, play, stop]);

  return (
    <div className="nf-wrapper">
      <div className="nf-sound">
        <SoundToggle />
      </div>

      <div className="nf-content">
        <div className="nf-404" role="img" aria-label="404">
          <span aria-hidden="true">4</span>
          <img src={openingPokeball} alt="" className="nf-pokeball" />
          <span aria-hidden="true">4</span>
        </div>

        <p className="nf-text">
          The path you chose leads nowhere, Trainer...
        </p>

        <div className="nf-buttons">
          <button type="button" className="nes-btn is-primary" onClick={() => navigate("/")}>
            Home
          </button>
          <button type="button" className="nes-btn is-error" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default PageNotFound;
