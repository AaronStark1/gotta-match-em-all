import { MAX_POKEMON_ID } from "../config/api";
import { readJSON, writeJSON } from "./storage";

/**
 * The player's personal Pokédex: every species ever caught (matched) in a
 * won game. Stored as a sorted array of National Dex numbers.
 */
const POKEDEX_KEY = "pokedex:v1";

export const POKEDEX_SIZE = MAX_POKEMON_ID;

const isDexId = (id) => Number.isInteger(id) && id >= 1 && id <= MAX_POKEMON_ID;

export function getCaughtIds() {
  const stored = readJSON(POKEDEX_KEY, []);
  return Array.isArray(stored) ? [...new Set(stored.filter(isDexId))] : [];
}

export function getPokedexCount() {
  return getCaughtIds().length;
}

/** Add `ids` to the Pokédex; returns the new total. Re-reads storage first. */
export function addCaught(ids) {
  const caught = new Set(getCaughtIds());
  for (const id of ids) {
    if (isDexId(id)) caught.add(id);
  }
  writeJSON(
    POKEDEX_KEY,
    [...caught].sort((a, b) => a - b)
  );
  return caught.size;
}
