import useReducedMotion, { useStillFrame } from "../../display/useReducedMotion";
import pokeGroupGif from "../../assets/gifs/poke-group.gif";

/**
 * Style for a `.landing` page root: with reduced motion, hands the CSS
 * backdrop a still first frame of the looping wallpaper GIF (--landing-still).
 */
export default function useBackdropStyle() {
  const reducedMotion = useReducedMotion();
  const still = useStillFrame(pokeGroupGif, reducedMotion);
  return still ? { "--landing-still": `url(${still})` } : undefined;
}
