import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { DIFFICULTIES } from "../config/difficulty";
import { createBoard, isAbortError } from "../services/pokemon";
import { getBestRecord, isBetterScore, isBetterTime, saveRecord } from "../utils/records";
import { addCaught, getCaughtIds } from "../utils/pokedex";
import { getStarRating } from "./rating";
import {
  MISMATCH_DELAY_MS,
  createInitialState,
  elapsedSeconds,
  gameReducer,
} from "./gameReducer";

/** Re-render on an interval while `active`, returning the current timestamp. */
function useNow(active, intervalMs = 250) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return undefined;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);

  return now;
}

/**
 * Game controller: loads a board for `difficulty`, owns the reducer, runs the
 * mismatch flip-back timer and the MM:SS clock, and persists best records.
 */
export default function usePokemonGame(difficulty) {
  const [state, dispatch] = useReducer(gameReducer, difficulty, createInitialState);
  const [loadRequest, setLoadRequest] = useState(0);
  const loadSeqRef = useRef(0);
  const preloadedImagesRef = useRef([]); // keep decoded sprites alive for this board
  const savedGameRef = useRef(null);

  // (Re)load a board whenever the difficulty changes or a reset is requested.
  useEffect(() => {
    const controller = new AbortController();
    loadSeqRef.current += 1;
    const gameId = loadSeqRef.current;
    const { pairs } = DIFFICULTIES[difficulty];

    dispatch({ type: "LOAD_START", gameId, difficulty });

    createBoard(pairs, { signal: controller.signal })
      .then(({ cards, images }) => {
        if (controller.signal.aborted) return;
        preloadedImagesRef.current = images;
        dispatch({
          type: "LOAD_SUCCESS",
          gameId,
          cards,
          bestAtStart: getBestRecord(difficulty),
          pokedexAtStart: getCaughtIds(),
        });
      })
      .catch((error) => {
        if (controller.signal.aborted || isAbortError(error)) return;
        dispatch({
          type: "LOAD_FAILURE",
          gameId,
          error: error?.message || "Something went wrong while catching Pokémon.",
        });
      });

    return () => controller.abort();
  }, [difficulty, loadRequest]);

  // Flip a mismatched pair back after a short reveal.
  useEffect(() => {
    if (!state.locked) return undefined;
    const gameId = state.gameId;
    const timer = setTimeout(
      () => dispatch({ type: "RESOLVE_MISMATCH", gameId }),
      MISMATCH_DELAY_MS
    );
    return () => clearTimeout(timer);
  }, [state.locked, state.gameId]);

  const won = state.status === "won";
  const clockRunning = state.status === "playing" && state.startedAt !== null;
  const now = useNow(clockRunning);
  const elapsed = elapsedSeconds(state.startedAt, state.finishedAt, now);
  const finalTime = won ? elapsedSeconds(state.startedAt, state.finishedAt, state.finishedAt) : null;

  // Persist best score / best time and the caught Pokémon exactly once per won game.
  useEffect(() => {
    if (!won || savedGameRef.current === state.gameId) return;
    savedGameRef.current = state.gameId;
    saveRecord(state.difficulty, { score: state.score, time: finalTime });
    addCaught(state.caught);
  }, [won, state.gameId, state.difficulty, state.score, finalTime, state.caught]);

  // Derived purely from the snapshot taken when the board was dealt, so the
  // win screen is correct on its very first render (before the save effect).
  let result = null;
  if (won) {
    const knownAtStart = new Set(state.pokedexAtStart);
    const caught = state.caught.map((id) => {
      const card = state.cards.find((entry) => entry.id === id);
      return {
        id,
        name: card ? card.name : "???",
        image: card ? card.image : null,
        imageFailed: card ? Boolean(card.imageFailed) : true,
        spriteFit: card && card.spriteFit ? card.spriteFit : null,
        cors: Boolean(card && card.cors),
        isNew: !knownAtStart.has(id),
      };
    });
    const newlyCaught = caught.filter((entry) => entry.isNew).length;
    result = {
      score: state.score,
      moves: state.moves,
      time: finalTime,
      pairs: state.totalPairs,
      rating: getStarRating(state.moves, state.totalPairs),
      previousBest: state.bestAtStart,
      isNewBestScore: isBetterScore(state.score, state.bestAtStart.score),
      isNewBestTime: isBetterTime(finalTime, state.bestAtStart.time),
      caught,
      newlyCaught,
      pokedexCount: knownAtStart.size + newlyCaught,
    };
  }

  const flipCard = useCallback(
    (uniqueId) => dispatch({ type: "FLIP", uniqueId, now: Date.now() }),
    []
  );

  const resetGame = useCallback(() => setLoadRequest((n) => n + 1), []);

  const reportImageError = useCallback((id) => dispatch({ type: "IMAGE_FAILED", id }), []);

  return {
    ...state,
    config: DIFFICULTIES[state.difficulty],
    elapsed,
    result,
    flipCard,
    resetGame,
    reportImageError,
  };
}
