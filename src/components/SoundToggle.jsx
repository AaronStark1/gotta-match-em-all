import useSound from "../audio/useSound";
import "../styles/Controls.css";

/** `[ 🔊 SFX ON ]` switch. Accessible name "SFX"; state is exposed via aria-checked. */
const SoundToggle = ({ className = "" }) => {
  const { muted, toggleMuted } = useSound();
  const on = !muted;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      className={`nes-btn sys-toggle sound-toggle ${on ? "is-warning" : ""} ${className}`}
      onClick={toggleMuted}
      title={on ? "Sound effects on: click to mute" : "Sound effects off: click to unmute"}
    >
      <span className="toggle-icon" aria-hidden="true">
        {on ? "🔊" : "🔇"}
      </span>
      <span className="toggle-label">SFX</span>
      <span className="toggle-state" aria-hidden="true">
        {on ? "ON" : "OFF"}
      </span>
    </button>
  );
};

export default SoundToggle;
