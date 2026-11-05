import { useId } from "react";
import { DIFFICULTIES, DIFFICULTY_ORDER, boardSizeLabel } from "../config/difficulty";
import "../styles/Controls.css";

const DifficultySelector = ({ value, onChange, compact = false }) => {
  const labelId = useId();

  return (
    <div className={`difficulty-selector ${compact ? "is-compact" : ""}`}>
      <span id={labelId} className="difficulty-label">
        Difficulty
      </span>
      <div className="difficulty-options" role="group" aria-labelledby={labelId}>
        {DIFFICULTY_ORDER.map((key) => {
          const option = DIFFICULTIES[key];
          const selected = key === value;
          return (
            <button
              key={key}
              type="button"
              className={`nes-btn difficulty-option ${selected ? "is-warning" : ""}`}
              aria-pressed={selected}
              onClick={() => {
                if (!selected) onChange(key);
              }}
            >
              <span className="difficulty-name">{option.label}</span>
              <span className="difficulty-size">{boardSizeLabel(option)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DifficultySelector;
