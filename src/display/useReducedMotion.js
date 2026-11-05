import { useEffect, useState, useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function getQuery() {
  try {
    return typeof window !== "undefined" && window.matchMedia ? window.matchMedia(QUERY) : null;
  } catch {
    return null;
  }
}

function subscribe(onChange) {
  const query = getQuery();
  if (!query || typeof query.addEventListener !== "function") return () => {};
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const getSnapshot = () => Boolean(getQuery()?.matches);
const getServerSnapshot = () => false;

/** Live `prefers-reduced-motion: reduce` flag. */
export default function useReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * First frame of an (animated) image as a PNG data URL, built only while
 * `enabled`. Used to freeze looping GIFs for reduced-motion users.
 * Resolves to null while loading, or if the frame can't be captured.
 */
export function useStillFrame(src, enabled) {
  const [frame, setFrame] = useState({ src: null, url: null });

  useEffect(() => {
    if (!enabled || !src) return undefined;
    let cancelled = false;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d").drawImage(img, 0, 0);
        setFrame({ src, url: canvas.toDataURL("image/png") });
      } catch {
        setFrame({ src, url: "" }); // tainted canvas etc.: caller falls back
      }
    };
    img.onerror = () => {
      if (!cancelled) setFrame({ src, url: "" });
    };
    img.src = src;
    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [src, enabled]);

  if (!enabled || frame.src !== src) return null;
  return frame.url;
}
