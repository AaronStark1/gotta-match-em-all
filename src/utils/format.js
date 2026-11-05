/** Seconds -> "MM:SS" (minutes keep counting past 99). */
export function formatTime(totalSeconds) {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** National Dex number as shown on cards: 25 -> "#025". */
export function formatDexNumber(id) {
  return `#${String(id).padStart(3, "0")}`;
}

/** Last National Dex number of each generation (Gen I..VIII). */
const GENERATION_ENDS = [151, 251, 386, 493, 649, 721, 809, 898];
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

/** Generation label derived from the Dex number alone: 25 -> "I", 810 -> "VIII". */
export function generationLabel(id) {
  const index = GENERATION_ENDS.findIndex((end) => id <= end);
  return index === -1 ? "?" : ROMAN[index];
}

/** 1400 -> "1,400" (arcade-style score readout). */
export function formatScore(value) {
  return Number.isFinite(value) ? Math.round(value).toLocaleString("en-US") : "0";
}

/** Species slugs whose display name can't be derived by capitalising words. */
const SPECIAL_NAMES = {
  "nidoran-f": "Nidoran♀",
  "nidoran-m": "Nidoran♂",
  "mr-mime": "Mr. Mime",
  "mime-jr": "Mime Jr.",
  "mr-rime": "Mr. Rime",
  farfetchd: "Farfetch'd",
  sirfetchd: "Sirfetch'd",
  "ho-oh": "Ho-Oh",
  "porygon-z": "Porygon-Z",
  "jangmo-o": "Jangmo-o",
  "hakamo-o": "Hakamo-o",
  "kommo-o": "Kommo-o",
  "type-null": "Type: Null",
  flabebe: "Flabébé",
};

const capitalise = (word) => word.charAt(0).toUpperCase() + word.slice(1);

/** "tapu-koko" -> "Tapu Koko", "mr-mime" -> "Mr. Mime". */
export function formatPokemonName(slug) {
  if (typeof slug !== "string" || slug.length === 0) return "???";
  return SPECIAL_NAMES[slug] ?? slug.split("-").filter(Boolean).map(capitalise).join(" ");
}
