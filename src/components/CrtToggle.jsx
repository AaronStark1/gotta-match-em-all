import useCrt from "../display/useCrt";
import "../styles/Controls.css";

/** `[ 📺 CRT ON ]` switch for the scanline overlay (persisted). */
const CrtToggle = ({ className = "" }) => {
  const { crtOn, toggleCrt } = useCrt();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={crtOn}
      className={`nes-btn sys-toggle crt-toggle ${crtOn ? "is-success" : ""} ${className}`}
      onClick={toggleCrt}
      title={crtOn ? "CRT scanlines on: click to turn off" : "CRT scanlines off: click to turn on"}
    >
      <span className="toggle-icon" aria-hidden="true">
        📺
      </span>
      <span className="toggle-label">CRT</span>
      <span className="toggle-state" aria-hidden="true">
        {crtOn ? "ON" : "OFF"}
      </span>
    </button>
  );
};

export default CrtToggle;
