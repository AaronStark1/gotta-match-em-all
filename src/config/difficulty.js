/**
 * Board presets. `rows x cols` must equal `pairs * 2`.
 */
export const DIFFICULTIES = {
  easy: { key: "easy", label: "Easy", rows: 3, cols: 4, pairs: 6 },
  medium: { key: "medium", label: "Medium", rows: 4, cols: 4, pairs: 8 },
  hard: { key: "hard", label: "Hard", rows: 4, cols: 5, pairs: 10 },
};

export const DIFFICULTY_ORDER = ["easy", "medium", "hard"];

export const DEFAULT_DIFFICULTY = "medium";

export const isDifficulty = (value) =>
  typeof value === "string" && Object.prototype.hasOwnProperty.call(DIFFICULTIES, value);

export const boardSizeLabel = ({ rows, cols }) => `${rows}x${cols}`;
