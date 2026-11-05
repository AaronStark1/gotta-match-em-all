import {
  IMAGE_TIMEOUT_MS,
  MAX_POKEMON_ID,
  POKEAPI_BASE,
  REQUEST_TIMEOUT_MS,
  spriteUrl,
} from "../config/api";
import cardFrontImage from "../assets/card_front_pixel.jpeg";
import { formatPokemonName } from "../utils/format";
import { pickDistinct, shuffle } from "../utils/random";
import { readJSON, writeJSON } from "../utils/storage";

/** Bump when the cached species payload shape changes. */
const SPECIES_CACHE_KEY = "species:v1";

/** A sprite that fails to load is swapped for another Pokémon this many times. */
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
 * Load an image without ever rejecting. Resolves { image, failure }: the
 * decoded HTMLImageElement (or null) and, on failure, why: "error",
 * "timeout" or "abort".
 */
function loadImage(src, { signal, timeout = IMAGE_TIMEOUT_MS, crossOrigin } = {}) {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve({ image: null, failure: "abort" });
      return;
    }

    const img = new Image();
    let settled = false;
    let timer = null;

    const finish = (image, failure = null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      img.onload = null;
      img.onerror = null;
      resolve({ image, failure });
    };

    function onAbort() {
      finish(null, "abort");
      img.src = "";
    }

    timer = setTimeout(() => finish(null, "timeout"), timeout);
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
    img.onerror = () => finish(null, "error");
    img.decoding = "async";
    if (crossOrigin) img.crossOrigin = crossOrigin;
    img.src = src;
  });
}

/**
 * Resolve with a decoded HTMLImageElement, or `null` if the image failed,
 * timed out or was aborted. Never rejects.
 */
export async function preloadImage(src, options) {
  return (await loadImage(src, options)).image;
}

/**
 * Sprites load in CORS mode so measureSpriteFit() can read their pixels. If
 * the host ever stopped sending CORS headers, that request would be blocked
 * outright, so a failed CORS load is retried once as a plain image: it still
 * displays, just without the auto-framing (`cors: false`). Timeouts and
 * aborts are not retried, so a slow sprite never costs two timeouts.
 */
async function loadSprite(id, signal) {
  const url = spriteUrl(id);
  const corsLoad = await loadImage(url, { signal, crossOrigin: "anonymous" });
  if (corsLoad.image) return { image: corsLoad.image, cors: true };
  if (corsLoad.failure !== "error") return null;
  const plainLoad = await loadImage(url, { signal });
  return plainLoad.image ? { image: plainLoad.image, cors: false } : null;
}

const ALPHA_THRESHOLD = 16;
const round3 = (value) => Math.round(value * 1000) / 1000;

/**
 * Sprites are 96x96 canvases with lots of transparent padding, so creatures
 * would render tiny. Measure the opaque bounding box once (CORS-loaded
 * sprites only: their pixels are readable) and return how to zoom/centre it:
 * { k: zoom factor, cx/cy: box centre as a fraction of the canvas }.
 * Returns null whenever measuring isn't possible; cards then show the plain
 * centred sprite.
 */
function measureSpriteFit(img) {
  try {
    const width = img?.naturalWidth;
    const height = img?.naturalHeight;
    if (!width || !height || typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, width, height);

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (data[(y * width + x) * 4 + 3] > ALPHA_THRESHOLD) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return null;

    const boxWidth = maxX - minX + 1;
    const boxHeight = maxY - minY + 1;
    // Fill ~90% of the frame width / ~86% of its height (room for the drop shadow).
    const fit = Math.min((0.9 * width) / boxWidth, (0.86 * height) / boxHeight);
    return {
      k: round3(Math.min(3, Math.max(0.9, fit))),
      cx: round3((minX + boxWidth / 2) / width),
      cy: round3((minY + boxHeight / 2) / height),
    };
  } catch {
    return null; // unexpected canvas failure: show the plain centred sprite
  }
}

/**
 * Build a shuffled deck of `pairs * 2` cards whose sprites are already loaded,
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
    const sprites = await Promise.all(candidates.map((id) => loadSprite(id, signal)));
    throwIfAborted(signal);

    failed = [];
    candidates.forEach((id, index) => {
      if (sprites[index]) loaded.push({ id, ...sprites[index] });
      else failed.push(id);
    });

    if (failed.length === 0 || attempt >= MAX_IMAGE_ATTEMPTS) break;
    // Swap Pokémon whose sprite is missing for fresh picks.
    candidates = pickDistinct(pool, failed.length, used);
    if (candidates.length === 0) break;
  }

  if (loaded.length === 0) {
    throw new Error("Couldn't load any Pokémon sprites. Check your connection.");
  }

  const cardFront = await cardFrontPromise;
  throwIfAborted(signal);

  const pokemon = [
    ...loaded.map(({ id, image, cors }) => ({
      id,
      imageFailed: false,
      cors,
      spriteFit: cors ? measureSpriteFit(image) : null,
    })),
    // Still missing after retries: show a Poké Ball + name so the pair stays matchable.
    ...failed
      .slice(0, pairs - loaded.length)
      .map((id) => ({ id, imageFailed: true, cors: false, spriteFit: null })),
  ].map(({ id, imageFailed, cors, spriteFit }) => ({
    id,
    name: formatPokemonName(names.get(id)),
    image: spriteUrl(id),
    imageFailed,
    // Render each <img> in the mode it was preloaded in, so it reuses that request.
    cors,
    spriteFit,
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
