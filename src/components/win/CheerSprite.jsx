import pikachuCheer from "../../assets/gifs/pikacheer.gif";
import useReducedMotion, { useStillFrame } from "../../display/useReducedMotion";

/**
 * Cheering Pikachu on a Hall of Fame podium. The GIF is 40x39 art pixels at
 * 12.5px each, so the CSS sizes it at whole multiples (3px / 2px per pixel).
 * With reduced motion the looping GIF is swapped for its first frame.
 */
const CheerSprite = () => {
  const reducedMotion = useReducedMotion();
  const still = useStillFrame(pikachuCheer, reducedMotion);

  let art;
  if (reducedMotion && still === null) {
    // Freezing the first frame takes a moment: hold the space, never animate.
    art = <span className="win-pikachu is-pending" aria-hidden="true" />;
  } else {
    art = (
      <img
        className="win-pikachu"
        src={reducedMotion && still ? still : pikachuCheer}
        alt="Pikachu cheering"
        width="120"
        height="117"
        draggable="false"
      />
    );
  }

  return (
    <div className="win-cheer">
      {art}
      <span className="win-podium" aria-hidden="true">
        <span className="win-podium-plate">No.1</span>
      </span>
    </div>
  );
};

export default CheerSprite;
