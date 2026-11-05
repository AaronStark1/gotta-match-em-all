import SoundToggle from "./SoundToggle";
import CrtToggle from "./CrtToggle";
import "../styles/Controls.css";

/** The `[ 🔊 SFX ]` + `[ 📺 CRT ]` pair shown in every page header. */
const SystemToggles = ({ className = "" }) => (
  <div className={`system-toggles ${className}`} role="group" aria-label="Display and sound">
    <SoundToggle />
    <CrtToggle />
  </div>
);

export default SystemToggles;
