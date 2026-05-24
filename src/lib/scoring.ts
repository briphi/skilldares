/**
 * Skilldares — Scoring.
 *
 * Per FR30–FR32 (plus a streak bonus added 2026-05-24):
 *  - Correct answer (no hint used) → 5 points
 *  - Correct answer (hint used)    → 2 points
 *  - Wrong answer                  → 0 points
 *  - +1 streak bonus when the resulting streak is >= STREAK_BONUS_THRESHOLD
 *    (i.e. this is the 3rd or later consecutive correct answer).
 *
 * Speed-round Type A/B are all-or-nothing scored; hints don't apply to speed
 * rounds, so callers pass `usedHint: false` for speed and `computePoints`
 * handles them the same as MC.
 *
 * The streak threshold is intentionally identical to the value
 * StreakIndicator uses for its visibility — the bonus kicks in exactly
 * when the on-screen "Streaking" indicator appears, so the player sees
 * the visual cue and the extra point as one moment.
 */

export const STREAK_BONUS_THRESHOLD = 3;
export const STREAK_BONUS_POINTS = 1;

export function computePoints(
  isCorrect: boolean,
  usedHint: boolean,
  streak: number = 0,
): number {
  if (!isCorrect) return 0;
  const base = usedHint ? 2 : 5;
  const bonus = streak >= STREAK_BONUS_THRESHOLD ? STREAK_BONUS_POINTS : 0;
  return base + bonus;
}
