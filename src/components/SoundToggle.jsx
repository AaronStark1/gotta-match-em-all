import useSound from "../audio/useSound";
import "../styles/Controls.css";

const SoundToggle = ({ className = "" }) => {
  const { muted, toggleMuted } = useSound();

  return (
    <button
      type="button"
      className={`nes-btn sound-toggle ${className}`}
      onClick={toggleMuted}
      aria-pressed={muted}
      aria-label="Mute sound"
      title={muted ? "Sound off: click to unmute" : "Sound on: click to mute"}
    >
      <span aria-hidden="true">{muted ? "🔇" : "🔊"}</span>
    </button>
  );
};

export default SoundToggle;
