import matchSfx from "../assets/sounds/card_match.mp3";
import victorySfx from "../assets/sounds/pokemon-victory-theme.mp3";
import wobbleSfx from "../assets/sounds/pokeball-wobble-404.mp3";

/** Sound catalogue. Audio elements are created lazily by SoundProvider. */
export const SOUNDS = {
  match: { src: matchSfx, volume: 0.6 },
  victory: { src: victorySfx, volume: 0.6 },
  wobble: { src: wobbleSfx, volume: 0.45, loop: true },
};
