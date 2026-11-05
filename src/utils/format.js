/** Seconds -> "MM:SS" (minutes keep counting past 99). */
export function formatTime(totalSeconds) {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
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
