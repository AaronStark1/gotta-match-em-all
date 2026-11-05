/**
 * Thin, failure-proof wrappers around localStorage.
 * Private browsing, disabled storage or quota errors must never crash the game,
 * so every access is guarded and falls back to a default value.
 */
const PREFIX = "gmea:";

export function readJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
