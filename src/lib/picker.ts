/**
 * Skilldares — Personality message picker (FR38).
 *
 * Two pure functions:
 *
 *  pickPool(previousStreak, isCorrect): PoolId
 *    Decides which message pool an answer should pull from, based on per-answer
 *    state plus streak transitions. The reducer (Story 1.8) calls this after
 *    every ANSWER_QUESTION action; the resulting pool ID is then used to draw
 *    a specific message via pickMessage.
 *
 *  pickMessage(messages, rng): string
 *    Uniform-random selection of one message from a pool. Rng is injected so
 *    tests are deterministic.
 *
 * Per FR38 (verbatim from PRD):
 *   On correct answer:
 *     - prev streak <= -3        → 'comeback'    (ending a 3+ wrong streak)
 *     - else if new streak >= 3  → 'on-fire'     (hitting/continuing 3+ correct)
 *     - else                     → 'right-no-streak'
 *
 *   On wrong answer:
 *     - prev streak >= 3         → 'streak-broken' (ending a 3+ correct streak)
 *     - else if new streak <= -3 → 'doing-bad'     (hitting/continuing 3+ wrong)
 *     - else                     → 'wrong-no-streak'
 *
 * Note: pickPool returns one of 6 active per-answer pools. `pre-game-encouragement`
 * (Start screen) and `new-high-score` (End screen) are picked elsewhere, not here.
 */

import type { MessagePoolId } from './schemas/message.schema';
import type { Rng } from './rng';
import { nextStreak } from './streak';

export function pickPool(previousStreak: number, isCorrect: boolean): MessagePoolId {
  const newStreak = nextStreak(previousStreak, isCorrect);
  if (isCorrect) {
    if (previousStreak <= -3) return 'comeback';
    if (newStreak >= 3) return 'on-fire';
    return 'right-no-streak';
  }
  if (previousStreak >= 3) return 'streak-broken';
  if (newStreak <= -3) return 'doing-bad';
  return 'wrong-no-streak';
}

/**
 * Uniform-random pick from a pool, optionally excluding one message
 * (typically the one shown immediately before from this same pool, to
 * avoid back-to-back repeats — see GameScreen + storage.ts).
 *
 * Falls back to the full pool if:
 *   - `excludeMessage` is omitted, null, or not present in the pool
 *   - excluding would leave 0 candidates (e.g. pool of size 1)
 */
export function pickMessage(
  messages: string[],
  rng: Rng,
  excludeMessage?: string | null,
): string {
  if (messages.length === 0) {
    throw new Error('pickMessage: pool is empty');
  }
  let candidates = messages;
  if (excludeMessage != null) {
    const filtered = messages.filter((m) => m !== excludeMessage);
    if (filtered.length > 0) candidates = filtered;
  }
  const index = Math.floor(rng() * candidates.length);
  return candidates[index]!;
}
