/**
 * Skilldares — Scoring.
 *
 * Per FR30–FR32:
 *  - Correct answer (no hint used) → 5 points
 *  - Correct answer (hint used)    → 2 points
 *  - Wrong answer                  → 0 points
 *
 * Speed-round Type A/B are all-or-nothing scored (5 for exact match, 0 otherwise);
 * hints don't apply to speed rounds, so callers pass `usedHint: false` for speed
 * and `computePoints` handles them the same as MC.
 */

export function computePoints(isCorrect: boolean, usedHint: boolean): number {
  if (!isCorrect) return 0;
  return usedHint ? 2 : 5;
}
