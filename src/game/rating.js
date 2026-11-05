/**
 * Star rating for a finished board. A perfect game takes one move per pair,
 * so "minimum moves" = number of pairs.
 *
 *   3 stars  Master Trainer: moves < 1.5x minimum
 *   2 stars  Great Trainer:  moves < 2.2x minimum
 *   1 star   Poké Trainer:   finished the board
 *
 * Ratios are kept in tenths and compared with integer maths: in floating
 * point 2.2 * 10 === 22.000000000000004, which would let 22 moves count
 * as "under 22".
 */
export const RATING_TIERS = [
  { stars: 3, title: "Master Trainer", ratioTenths: 15 },
  { stars: 2, title: "Great Trainer", ratioTenths: 22 },
  { stars: 1, title: "Poké Trainer", ratioTenths: Infinity },
];

export const MAX_STARS = 3;

/** "1.5x" / "2.2x" label for a tier, for rules screens. */
export const ratioLabel = ({ ratioTenths }) => `${ratioTenths / 10}x`;

export function getStarRating(moves, pairs) {
  const minimumMoves = Math.max(1, pairs);
  const tier =
    RATING_TIERS.find(({ ratioTenths }) => moves * 10 < ratioTenths * minimumMoves) ??
    RATING_TIERS[RATING_TIERS.length - 1];
  return { stars: tier.stars, title: tier.title, minimumMoves };
}

/** Most moves that still earn `stars` on a board of `pairs` (Infinity for 1 star). */
export function maxMovesForStars(stars, pairs) {
  const tier = RATING_TIERS.find((entry) => entry.stars === stars);
  if (!tier || tier.ratioTenths === Infinity) return Infinity;
  return Math.ceil((tier.ratioTenths * pairs) / 10) - 1;
}
