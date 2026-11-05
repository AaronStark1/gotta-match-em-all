import { DIFFICULTIES, DIFFICULTY_ORDER } from "../../config/difficulty";
import { getBestRecord } from "../../utils/records";
import { getPokedexCount, POKEDEX_SIZE } from "../../utils/pokedex";
import { formatScore, formatTime } from "../../utils/format";

/**
 * Snapshot of the player's saved progress for the battle text box:
 * best score / best time per difficulty (null when never set) and the
 * personal Pokédex count. Read fresh from localStorage on every call.
 */
export function readTrainerRecords() {
  return {
    rows: DIFFICULTY_ORDER.map((key) => {
      const best = getBestRecord(key);
      return {
        key,
        label: DIFFICULTIES[key].label,
        score: best.score === null ? null : formatScore(best.score),
        time: best.time === null ? null : formatTime(best.time),
      };
    }),
    caught: getPokedexCount(),
    dexSize: POKEDEX_SIZE,
  };
}

/** Row layout only, for <TrainerRecords skeleton /> (reserves the text box height). */
export const RECORDS_SKELETON = {
  rows: DIFFICULTY_ORDER.map((key) => ({ key })),
};
