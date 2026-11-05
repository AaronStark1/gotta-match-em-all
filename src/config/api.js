export const POKEAPI_BASE = "https://pokeapi.co/api/v2";

/**
 * 96x96 pixel-art sprites (≈0.3–1.5 KB each). They render crisply with
 * `image-rendering: pixelated` at any card size, unlike the large
 * official artwork, which aliases badly under nearest-neighbour scaling.
 */
const SPRITE_BASE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

/**
 * Highest National Pokédex number with guaranteed sprites (Gen 1–8).
 * Random picks are restricted to 1..MAX_POKEMON_ID so every card has art.
 */
export const MAX_POKEMON_ID = 898;

/** Abort PokéAPI requests that hang longer than this. */
export const REQUEST_TIMEOUT_MS = 10000;

/** Give up on a single sprite after this long and swap in a replacement. */
export const IMAGE_TIMEOUT_MS = 8000;

export const spriteUrl = (id) => `${SPRITE_BASE}/${id}.png`;
