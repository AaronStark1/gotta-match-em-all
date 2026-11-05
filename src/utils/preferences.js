import { DEFAULT_DIFFICULTY, isDifficulty } from "../config/difficulty";
import { readJSON, writeJSON } from "./storage";

const DIFFICULTY_KEY = "difficulty";
const MUTED_KEY = "muted";

export function getPreferredDifficulty() {
  const stored = readJSON(DIFFICULTY_KEY, DEFAULT_DIFFICULTY);
  return isDifficulty(stored) ? stored : DEFAULT_DIFFICULTY;
}

export function setPreferredDifficulty(difficulty) {
  if (isDifficulty(difficulty)) writeJSON(DIFFICULTY_KEY, difficulty);
}

export function getStoredMuted() {
  return readJSON(MUTED_KEY, false) === true;
}

export function setStoredMuted(muted) {
  writeJSON(MUTED_KEY, Boolean(muted));
}
