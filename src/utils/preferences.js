import { DEFAULT_DIFFICULTY, isDifficulty } from "../config/difficulty";
import { readJSON, writeJSON } from "./storage";

const DIFFICULTY_KEY = "difficulty";
const MUTED_KEY = "muted";
const CRT_KEY = "crt";

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

function prefersHighContrast() {
  try {
    return Boolean(window.matchMedia?.("(prefers-contrast: more)").matches);
  } catch {
    return false;
  }
}

/**
 * CRT scanlines are on by default (it's the arcade look), except for people
 * who asked their OS for more contrast. An explicit choice always wins.
 */
export function getStoredCrt() {
  const stored = readJSON(CRT_KEY, null);
  if (typeof stored === "boolean") return stored;
  return !prefersHighContrast();
}

export function setStoredCrt(on) {
  writeJSON(CRT_KEY, Boolean(on));
}
