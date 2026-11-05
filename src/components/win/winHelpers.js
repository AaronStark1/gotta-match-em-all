/**
 * Pure helpers for the win screen ("Hall of Fame Induction").
 * Kept out of the .jsx files so those only export React components.
 */

/** Game Boy-style caps that keep the small "é": "Poké Trainer" -> "POKé TRAINER". */
export function retroCaps(text) {
  return String(text).toUpperCase().replace(/É/g, "é");
}

/**
 * Tray columns that split `count` slots into even rows on wide screens
 * (6 -> 3 per row, 8 -> 4, 10 -> 5). CSS still drops columns when the
 * tray gets too narrow, so this is a maximum, never a requirement.
 */
export function trayColumns(count) {
  if (count <= 5) return Math.max(1, count);
  const even = [5, 4, 3].find((cols) => count % cols === 0);
  return even || 4;
}

/**
 * Sprites are 96x96 canvases with lots of empty padding. When the board
 * measured the creature's bounding box (`spriteFit`), zoom in on it, snapped
 * to half steps (1, 1.5 or 2) so pixels stay even-sized.
 */
function spriteZoom(fit) {
  if (!fit || !Number.isFinite(fit.k)) return 1;
  return Math.min(2, Math.max(1, Math.floor(fit.k * 2) / 2));
}

/** Clamp a 0..1 fraction (bounding-box centre), defaulting to the middle. */
function unitFraction(value) {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.5;
}

/** Sprite / Poké Ball sizing for a tray slot, as CSS custom properties. */
export function spriteStyle(fit, isFallback) {
  if (isFallback || !fit) return undefined;
  return {
    "--sprite-zoom": spriteZoom(fit),
    "--sprite-cx": unitFraction(fit.cx),
    "--sprite-cy": unitFraction(fit.cy),
  };
}

/** "11 moves" / "1 move". */
export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keep Tab / Shift+Tab cycling inside the modal (aria-modal only hides the
 * rest of the page from screen readers, not from the keyboard).
 */
export function trapTabKey(event, container) {
  if (event.key !== "Tab" || !container) return;
  const focusable = Array.from(container.querySelectorAll(FOCUSABLE)).filter(
    (element) => element.getClientRects().length > 0
  );
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;
  const inside = container.contains(active);

  if (event.shiftKey && (active === first || !inside || active === container)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || !inside)) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * Original 12x12 pixel Poké Ball for the confetti (K outline, R red top,
 * W white bottom / button, H shine). "." is transparent.
 */
export const PIXEL_BALL = [
  "....KKKK....",
  "..KKRRRRKK..",
  ".KRRRRRRRRK.",
  ".KRHHRRRRRK.",
  "KRRHRKKRRRRK",
  "KKKKKWWKKKKK",
  "KWWWWKKWWWWK",
  "KWWWWWWWWWWK",
  ".KWWWWWWWWK.",
  ".KWWWWWWWWK.",
  "..KKWWWWKK..",
  "....KKKK....",
];

export const PIXEL_BALL_COLORS = { K: "#000000", R: "#ee1515", W: "#ffffff", H: "#ffb3b3" };

/** 3x3 twinkle spark ("X" takes each spark colour in turn). */
export const PIXEL_SPARK = [".X.", "XXX", ".X."];

export const SPARK_COLORS = ["#ffcb05", "#ffffff", "#ee1515", "#2a75bb"];
