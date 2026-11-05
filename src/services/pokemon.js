import {
  IMAGE_TIMEOUT_MS,
  MAX_POKEMON_ID,
  POKEAPI_BASE,
  REQUEST_TIMEOUT_MS,
  artworkUrl,
} from "../config/api";
import cardFrontImage from "../assets/card_front_pixel.jpeg";
import { formatPokemonName } from "../utils/format";
import { pickDistinct, shuffle } from "../utils/random";
import { readJSON, writeJSON } from "../utils/storage";

/** Bump when the cached species payload shape changes. */
const SPECIES_CACHE_KEY = "species:v1";

/** Artwork that fails to load is swapped for another Pokémon this many times. */
const MAX_IMAGE_ATTEMPTS = 2;

let speciesNames = null; // Map<id, slug>, shared across games in this session
let speciesRequest = null; // in-flight load shared by every board waiting on it

const abortError = () => new DOMException("The operation was aborted.", "AbortError");

function throwIfAborted(signal) {
  if (signal?.aborted) throw abortError();
}

export const isAbortError = (error) => error?.name === "AbortError";

async function fetchJSON(url, signal) {
  throwIfAborted(signal);
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`PokéAPI responded with HTTP ${response.status}.`);
    return await response.json();
  } catch (error) {
    if (signal?.aborted) throw abortError();
    if (timedOut) throw new Error("PokéAPI took too long to respond.");
    if (error instanceof TypeError) throw new Error("Couldn't reach PokéAPI. Check your connection.");
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

function toNameMap(entries) {
  const names = new Map();
  for (const [id, slug] of entries) {
    if (Number.isInteger(id) && id >= 1 && id <= MAX_POKEMON_ID && typeof slug === "string") {
      names.set(id, slug);
    }
  }
  return names;
}

function readCachedSpecies() {
  const cached = readJSON(SPECIES_CACHE_KEY, null);
  if (!Array.isArray(cached)) return null;
  const names = toNameMap(cached);
  return names.size >= MAX_POKEMON_ID * 0.9 ? names : null;
}

async function loadSpeciesNames() {
  const cached = readCachedSpecies();
  if (cached) return cached;

  // No caller signal: one board being reset must not abort the request that
  // the next board is about to wait on. REQUEST_TIMEOUT_MS still applies.
  const data = await fetchJSON(`${POKEAPI_BASE}/pokemon-species?limit=${MAX_POKEMON_ID}`);
  const entries = (Array.isArray(data?.results) ? data.results : []).map((entry) => {
    const match = typeof entry?.url === "string" ? entry.url.match(/\/(\d+)\/?$/) : null;
    return [match ? Number(match[1]) : NaN, entry?.name];
  });
  const names = toNameMap(entries);
  if (names.size === 0) throw new Error("PokéAPI returned an unexpected response.");

  writeJSON(SPECIES_CACHE_KEY, [...names.entries()]);
  return names;
}

/** Settle with `promise`, or reject with an AbortError as soon as `signal` aborts. */
function untilAborted(promise, signal) {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(abortError());
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(abortError());
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      }
    );
  });
}

/**
 * Resolve the names of every species in 1..MAX_POKEMON_ID with a single
 * request (instead of one `pokemon-species/{id}` call per card), cached in
 * memory and localStorage so later games need no PokéAPI round trip at all.
 * Concurrent callers share one in-flight request; failures are not cached.
 */
export function fetchSpeciesNames(signal) {
  if (speciesNames) return Promise.resolve(speciesNames);
  if (!speciesRequest) {
    speciesRequest = loadSpeciesNames().then(
      (names) => {
        speciesNames = names;
        return names;
      },
      (error) => {
        speciesRequest = null;
        throw error;
      }
    );
  }
  return untilAborted(speciesRequest, signal);
}

/**
 * Resolve with a decoded HTMLImageElement, or `null` if the image failed,
 * timed out or was aborted. Never rejects.
 */
export function preloadImage(src, { signal, timeout = IMAGE_TIMEOUT_MS } = {}) {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve(null);
      return;
    }

    const img = new Image();
    let settled = false;
    let timer = null;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      img.onload = null;
      img.onerror = null;
      resolve(result);
    };

    function onAbort() {
      finish(null);
      img.src = "";
    }

    timer = setTimeout(() => finish(null), timeout);
    signal?.addEventListener("abort", onAbort, { once: true });
    img.onload = () => {
      if (typeof img.decode !== "function") {
        finish(img);
        return;
      }
      img.decode().then(
        () => finish(img),
        () => finish(img)
      );
    };
    img.onerror = () => finish(null);
    img.decoding = "async";
    img.src = src;
  });
}

/**
 * Build a shuffled deck of `pairs * 2` cards whose artwork is already loaded,
 * so no card ever flips to a blank face.
 */
export async function createBoard(pairs, { signal } = {}) {
  const names = await fetchSpeciesNames(signal);
  throwIfAborted(signal);

  const pool = [...names.keys()];
  if (pool.length < pairs) throw new Error("PokéAPI returned too few Pokémon.");

  const cardFrontPromise = preloadImage(cardFrontImage, { signal });
  const used = new Set();
  const loaded = [];
  let candidates = pickDistinct(pool, pairs, used);
  let failed = [];

  for (let attempt = 1; ; attempt += 1) {
    const images = await Promise.all(
      candidates.map((id) => preloadImage(artworkUrl(id), { signal }))
    );
    throwIfAborted(signal);

    failed = [];
    candidates.forEach((id, index) => {
      if (images[index]) loaded.push({ id, image: images[index] });
      else failed.push(id);
    });

    if (failed.length === 0 || attempt >= MAX_IMAGE_ATTEMPTS) break;
    // Swap Pokémon whose artwork is missing for fresh picks.
    candidates = pickDistinct(pool, failed.length, used);
    if (candidates.length === 0) break;
  }

  if (loaded.length === 0) {
    throw new Error("Couldn't load any Pokémon artwork. Check your connection.");
  }

  const cardFront = await cardFrontPromise;
  throwIfAborted(signal);

  const pokemon = [
    ...loaded.map(({ id }) => ({ id, imageFailed: false })),
    // Still missing after retries: show a Poké Ball + name so the pair stays matchable.
    ...failed.slice(0, pairs - loaded.length).map((id) => ({ id, imageFailed: true })),
  ].map(({ id, imageFailed }) => ({
    id,
    name: formatPokemonName(names.get(id)),
    image: artworkUrl(id),
    imageFailed,
  }));

  const cards = shuffle([...pokemon, ...pokemon]).map((card, index) => ({
    ...card,
    uniqueId: index,
    flipped: false,
    matched: false,
  }));

  return {
    cards,
    images: [cardFront, ...loaded.map(({ image }) => image)].filter(Boolean),
  };
}
