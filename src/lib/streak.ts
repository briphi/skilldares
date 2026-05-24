/**
 * Skilldares — Streak transitions.
 *
 * Streak is a signed integer:
 *   > 0  → active correct streak (length = value)
 *   < 0  → active wrong streak (length = abs(value))
 *   == 0 → no streak (initial state, also after Play Again per FR40)
 *
 * Transition rules (used by the reducer in Story 1.8 after every answer):
 *
 *  on correct:
 *    if previous >= 0 → new = previous + 1   (continue or start positive)
 *    if previous < 0  → new = +1             (reset from negative)
 *
 *  on wrong:
 *    if previous <= 0 → new = previous - 1   (continue or start negative)
 *    if previous > 0  → new = -1             (reset from positive)
 */

export function nextStreak(previousStreak: number, isCorrect: boolean): number {
  if (isCorrect) {
    return previousStreak >= 0 ? previousStreak + 1 : 1;
  }
  return previousStreak <= 0 ? previousStreak - 1 : -1;
}
