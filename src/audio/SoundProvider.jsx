import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { SoundContext } from "./SoundContext";
import { SOUNDS } from "./sounds";
import { getStoredMuted, setStoredMuted } from "../utils/preferences";

/**
 * App-wide audio: lazily creates <audio> elements on first use (never at
 * module load), honours a persisted mute toggle, and synthesises a short
 * 8-bit square-wave "buzz" for mismatches via the Web Audio API.
 */
export default function SoundProvider({ children }) {
  const [muted, setMuted] = useState(getStoredMuted);
  const mutedRef = useRef(muted);
  const audioRef = useRef(new Map());
  const audioContextRef = useRef(null);

  // Layout effect: the ref must be current before any child's passive effect
  // (e.g. the 404 page resuming its loop on unmute) calls play().
  useLayoutEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    setStoredMuted(muted);
    if (muted) audioRef.current.forEach((audio) => audio.pause());
  }, [muted]);

  useEffect(() => {
    const elements = audioRef.current;
    return () => elements.forEach((audio) => audio.pause());
  }, []);

  const getAudio = useCallback((key) => {
    const sound = SOUNDS[key];
    if (!sound) return null;
    let audio = audioRef.current.get(key);
    if (!audio) {
      audio = new Audio(sound.src);
      audio.preload = "auto";
      audio.volume = sound.volume ?? 1;
      audio.loop = Boolean(sound.loop);
      audioRef.current.set(key, audio);
    }
    return audio;
  }, []);

  /** Resolves `true` if playback started, `false` if muted or blocked. */
  const play = useCallback(
    (key) => {
      if (mutedRef.current) return Promise.resolve(false);
      const audio = getAudio(key);
      if (!audio) return Promise.resolve(false);
      try {
        audio.currentTime = 0;
      } catch {
        // Not seekable yet; play from wherever it is.
      }
      const attempt = audio.play();
      return attempt ? attempt.then(() => true, () => false) : Promise.resolve(true);
    },
    [getAudio]
  );

  const stop = useCallback((key) => {
    const audio = audioRef.current.get(key);
    if (!audio) return;
    audio.pause();
    try {
      audio.currentTime = 0;
    } catch {
      // Ignore: element may not be seekable yet.
    }
  }, []);

  /** Warm up sounds so the first play isn't delayed (skipped while muted). */
  const preload = useCallback(
    (keys) => {
      if (mutedRef.current) return;
      keys.forEach((key) => getAudio(key));
    },
    [getAudio]
  );

  const buzz = useCallback(() => {
    if (mutedRef.current) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    try {
      if (!audioContextRef.current) audioContextRef.current = new AudioCtx();
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});

      const start = ctx.currentTime;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(196, start);
      oscillator.frequency.exponentialRampToValueAtTime(82, start + 0.22);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.07, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.24);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
      oscillator.start(start);
      oscillator.stop(start + 0.25);
    } catch {
      // Audio is a nice-to-have; never let it break the game.
    }
  }, []);

  const toggleMuted = useCallback(() => setMuted((value) => !value), []);

  const value = useMemo(
    () => ({ muted, toggleMuted, play, stop, preload, buzz }),
    [muted, toggleMuted, play, stop, preload, buzz]
  );

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}
