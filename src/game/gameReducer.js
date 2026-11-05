/**
 * Pure game state machine. All card-flip logic lives here so every decision is
 * made against the latest state (no stale closures) and is unit-testable.
 *
 * status: "loading" -> "playing" -> "won"
 *                  \-> "error" (retry -> "loading")
 */
import { DEFAULT_DIFFICULTY } from "../config/difficulty";

export const MATCH_POINTS = 100;
export const MISMATCH_PENALTY = 20;
export const MISMATCH_DELAY_MS = 1000;

const NO_RECORD = { score: null, time: null };

export function createInitialState(difficulty = DEFAULT_DIFFICULTY) {
  return {
    status: "loading",
    gameId: 0,
    difficulty,
    cards: [],
    flipped: [], // uniqueIds face-up and not yet resolved (0, 1 or 2)
    locked: false, // true while a mismatched pair is on display
    score: 0,
    moves: 0,
    matchedPairs: 0,
    totalPairs: 0,
    startedAt: null, // ms timestamp of the first flip
    finishedAt: null, // ms timestamp of the winning flip
    bestAtStart: NO_RECORD, // stored record when this board was dealt
    lastEvent: null, // { type: "flip" | "match" | "mismatch", ... } for sound + announcements
    error: null,
  };
}

function flipCard(state, { uniqueId, now }) {
  if (state.status !== "playing" || state.locked) return state;

  const index = state.cards.findIndex((card) => card.uniqueId === uniqueId);
  const clicked = index === -1 ? undefined : state.cards[index];
  // Guards against the double-click exploit: a card that is already face-up,
  // matched or pending can never be counted twice.
  if (!clicked || clicked.flipped || clicked.matched) return state;
  if (state.flipped.includes(uniqueId) || state.flipped.length >= 2) return state;

  const startedAt = state.startedAt ?? now;
  const cards = state.cards.map((card) =>
    card.uniqueId === uniqueId ? { ...card, flipped: true } : card
  );
  const flipped = [...state.flipped, uniqueId];

  if (flipped.length < 2) {
    return {
      ...state,
      cards,
      flipped,
      startedAt,
      lastEvent: { type: "flip", name: clicked.name, position: index + 1 },
    };
  }

  const [first, second] = flipped.map((id) => cards.find((card) => card.uniqueId === id));
  const moves = state.moves + 1;

  if (first.id === second.id) {
    const matchedPairs = state.matchedPairs + 1;
    const won = matchedPairs >= state.totalPairs;
    return {
      ...state,
      cards: cards.map((card) =>
        card.uniqueId === first.uniqueId || card.uniqueId === second.uniqueId
          ? { ...card, matched: true }
          : card
      ),
      flipped: [],
      moves,
      matchedPairs,
      score: state.score + MATCH_POINTS,
      startedAt,
      status: won ? "won" : "playing",
      finishedAt: won ? now : null,
      lastEvent: {
        type: "match",
        name: first.name,
        won,
        moves,
        matchedPairs,
        totalPairs: state.totalPairs,
      },
    };
  }

  return {
    ...state,
    cards,
    flipped,
    moves,
    locked: true,
    score: Math.max(0, state.score - MISMATCH_PENALTY),
    startedAt,
    lastEvent: { type: "mismatch", names: [first.name, second.name], moves },
  };
}

export function gameReducer(state, action) {
  switch (action.type) {
    case "LOAD_START":
      return {
        ...createInitialState(action.difficulty),
        gameId: action.gameId,
      };

    case "LOAD_SUCCESS":
      if (action.gameId !== state.gameId || state.status !== "loading") return state;
      return {
        ...state,
        status: "playing",
        cards: action.cards,
        totalPairs: action.cards.length / 2,
        bestAtStart: action.bestAtStart ?? NO_RECORD,
      };

    case "LOAD_FAILURE":
      if (action.gameId !== state.gameId || state.status !== "loading") return state;
      return { ...state, status: "error", error: action.error };

    case "FLIP":
      return flipCard(state, action);

    case "RESOLVE_MISMATCH":
      if (action.gameId !== state.gameId || !state.locked) return state;
      return {
        ...state,
        cards: state.cards.map((card) =>
          state.flipped.includes(card.uniqueId) ? { ...card, flipped: false } : card
        ),
        flipped: [],
        locked: false,
      };

    case "IMAGE_FAILED":
      if (!state.cards.some((card) => card.id === action.id && !card.imageFailed)) return state;
      return {
        ...state,
        cards: state.cards.map((card) =>
          card.id === action.id ? { ...card, imageFailed: true } : card
        ),
      };

    default:
      return state;
  }
}

/** Whole seconds between first flip and `now` (or the winning flip). */
export function elapsedSeconds(startedAt, finishedAt, now) {
  if (startedAt === null) return 0;
  const end = finishedAt ?? now;
  return Math.max(0, Math.floor((end - startedAt) / 1000));
}
