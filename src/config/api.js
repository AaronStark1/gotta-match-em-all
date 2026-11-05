export const POKEAPI_BASE = "https://pokeapi.co/api/v2";

export const OFFICIAL_ARTWORK =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork";

/**
 * Highest National Pokédex number with guaranteed official artwork (Gen 1–8).
 * Random picks are restricted to 1..MAX_POKEMON_ID so every card has art.
 */
export const MAX_POKEMON_ID = 898;

/** Abort PokéAPI requests that hang longer than this. */
export const REQUEST_TIMEOUT_MS = 10000;

/** Give up on a single artwork image after this long and swap in a replacement. */
export const IMAGE_TIMEOUT_MS = 8000;

export const artworkUrl = (id) => `${OFFICIAL_ARTWORK}/${id}.png`;
