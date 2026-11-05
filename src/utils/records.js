import { readJSON, writeJSON } from "./storage";

/**
 * Best Score (highest) and Best Time (fewest seconds) are tracked
 * independently per difficulty, so they may come from different games.
 */
const recordKey = (difficulty) => `best:${difficulty}`;

const toRecordValue = (value) =>
  Number.isFinite(value) && value >= 0 ? Math.floor(value) : null;

export const EMPTY_RECORD = Object.freeze({ score: null, time: null });

export function getBestRecord(difficulty) {
  const stored = readJSON(recordKey(difficulty), null);
  if (!stored || typeof stored !== "object") return EMPTY_RECORD;
  return { score: toRecordValue(stored.score), time: toRecordValue(stored.time) };
}

export const isBetterScore = (score, best) => best === null || score > best;
export const isBetterTime = (time, best) => best === null || time < best;

/**
 * Merge a finished game into the stored record. Re-reads storage first so a
 * record set in another tab is never clobbered by a worse result.
 */
export function saveRecord(difficulty, { score, time }) {
  const previous = getBestRecord(difficulty);
  const best = {
    score: isBetterScore(score, previous.score) ? score : previous.score,
    time: isBetterTime(time, previous.time) ? time : previous.time,
  };
  writeJSON(recordKey(difficulty), best);
  return best;
}
