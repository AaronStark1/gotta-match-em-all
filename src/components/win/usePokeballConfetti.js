import { useEffect } from "react";
import confetti from "canvas-confetti";
import { PIXEL_BALL, PIXEL_BALL_COLORS, PIXEL_SPARK, SPARK_COLORS } from "./winHelpers";

/**
 * CSS pixels per confetti pixel. The canvas is drawn at 1/PIXEL resolution
 * and upscaled with nearest-neighbour filtering, so everything on it comes
 * out as chunky 8-bit pixels. Speeds below are in CSS pixels per frame and
 * divided by PIXEL when fired.
 */
const PIXEL = 3;

const DRIZZLE_EVERY_MS = 200;
const DRIZZLE_FOR_MS = 2400;

/**
 * A pixel map as a canvas-confetti bitmap shape, drawn at native size (the
 * same shape format confetti.shapeFromText() returns). Null if the browser
 * can't make bitmaps.
 */
function bitmapShape(rows, colors) {
  try {
    if (typeof OffscreenCanvas === "undefined") return null;
    const width = rows[0].length;
    const height = rows.length;
    const sprite = new OffscreenCanvas(width, height);
    const ctx = sprite.getContext("2d");
    rows.forEach((row, y) => {
      [...row].forEach((cell, x) => {
        if (!colors[cell]) return;
        ctx.fillStyle = colors[cell];
        ctx.fillRect(x, y, 1, 1);
      });
    });
    return {
      type: "bitmap",
      bitmap: sprite.transferToImageBitmap(),
      matrix: [1, 0, 0, 1, -width / 2, -height / 2],
    };
  } catch {
    return null;
  }
}

// Built lazily on the first win (not at module load) and reused afterwards.
let shapes = null;

function getShapes() {
  if (shapes) return shapes;
  const ball = bitmapShape(PIXEL_BALL, PIXEL_BALL_COLORS);
  const sparks = SPARK_COLORS.map((color) => bitmapShape(PIXEL_SPARK, { X: color }));
  if (ball && sparks.every(Boolean)) {
    shapes = { pixel: true, balls: [ball], sparks };
  } else {
    // Older browsers: the classic one-colour Poké Ball outline + squares.
    const outline = confetti.shapeFromPath({
      path: `
        M256 32C132.3 32 32 132.3 32 256s100.3 224 224 224
        224-100.3 224-224S379.7 32 256 32zm0 48
        c97.2 0 176 78.8 176 176h-160v-48h-32v48H80
        c0-97.2 78.8-176 176-176zm0 352
        c-97.2 0-176-78.8-176-176h160v48h32v-48h160
        c0 97.2-78.8 176-176 176zm0-224
        c-26.5 0-48 21.5-48 48s21.5 48 48 48
        48-21.5 48-48-21.5-48-48-48z
      `,
      matrix: [0.04, 0, 0, 0.04, -10, -10],
    });
    shapes = { pixel: false, balls: [outline], sparks: ["square"] };
  }
  return shapes;
}

/**
 * Pokéball confetti on its own click-through canvas: one big burst, then a
 * short drizzle from the top. Skipped entirely for reduced motion, and fully
 * cleaned up (timers, listener, canvas) on unmount.
 */
export default function usePokeballConfetti() {
  useEffect(() => {
    // canvas-confetti would skip every burst anyway (disableForReducedMotion):
    // don't even add the canvas.
    const reducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return undefined;

    const canvas = document.createElement("canvas");
    canvas.className = "win-confetti";
    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, {
      position: "fixed",
      inset: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      zIndex: "99999999",
      imageRendering: "pixelated",
    });

    const fitCanvas = () => {
      canvas.width = Math.max(1, Math.ceil(window.innerWidth / PIXEL));
      canvas.height = Math.max(1, Math.ceil(window.innerHeight / PIXEL));
      // Resizing resets the context: keep sprite scaling nearest-neighbour.
      const context = canvas.getContext("2d");
      if (context) context.imageSmoothingEnabled = false;
    };
    fitCanvas();
    document.body.appendChild(canvas);

    // We size the low-res canvas ourselves (resize: false); custom shapes
    // need the main-thread renderer (useWorker: false).
    const myConfetti = confetti.create(canvas, {
      resize: false,
      useWorker: false,
      disableForReducedMotion: true,
    });
    const { pixel, balls, sparks } = getShapes();

    const fire = ({ ballCount, sparkCount, startVelocity, ...options }) => {
      const shared = {
        ...options,
        startVelocity: startVelocity / PIXEL,
        gravity: 1 / PIXEL,
        colors: SPARK_COLORS, // only tints the fallback shapes
      };
      myConfetti({ ...shared, particleCount: ballCount, shapes: balls, scalar: pixel ? 1 : 0.65 });
      myConfetti({ ...shared, particleCount: sparkCount, shapes: sparks, scalar: pixel ? 1 : 0.3 });
    };

    fire({ ballCount: 70, sparkCount: 80, spread: 160, startVelocity: 35, origin: { y: 0.6 } });

    const drizzle = setInterval(() => {
      fire({
        ballCount: 12,
        sparkCount: 10,
        spread: 180,
        startVelocity: 18,
        decay: 0.92,
        origin: { x: Math.random(), y: 0 },
      });
    }, DRIZZLE_EVERY_MS);
    const stopDrizzle = setTimeout(() => clearInterval(drizzle), DRIZZLE_FOR_MS);

    // A resized canvas would keep stale bounds mid-animation: start clean.
    const onResize = () => {
      myConfetti.reset();
      fitCanvas();
    };
    window.addEventListener("resize", onResize);

    return () => {
      clearInterval(drizzle);
      clearTimeout(stopDrizzle);
      window.removeEventListener("resize", onResize);
      myConfetti.reset();
      canvas.remove();
    };
  }, []);
}
