import { pickOne } from "../utils/random";

// Eager glob only bundles each GIF's URL string; the browser downloads just the
// one that gets applied as the board background.
const modules = import.meta.glob("../assets/backgrounds/*.gif", {
  eager: true,
  import: "default",
});

export const BACKGROUNDS = Object.keys(modules)
  .sort()
  .map((path) => modules[path]);

/** Pick a random background, avoiding `previous` so a reset visibly changes it. */
export function pickBackground(previous) {
  const options =
    BACKGROUNDS.length > 1 ? BACKGROUNDS.filter((bg) => bg !== previous) : BACKGROUNDS;
  return pickOne(options);
}
