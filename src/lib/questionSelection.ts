/**
 * Skilldares — Question selection.
 *
 * Generic random-without-replacement helper used by Stories 1.8 + 2.3 to draw
 * questions for each game. Story 1.6 ships just this primitive; the higher-level
 * `selectGame` (combining MC + speed-A + speed-B with the FR3 50/50 split)
 * lands in Story 2.3.
 *
 * Uses Fisher–Yates shuffle (truncated to N) for uniform-random selection.
 * Does not mutate the input pool.
 */

import type { Rng } from './rng';

export function pickRandomFromPool<T>(pool: T[], count: number, rng: Rng): T[] {
  if (count < 0) {
    throw new Error(`pickRandomFromPool: count must be >= 0, got ${count}`);
  }
  if (count > pool.length) {
    throw new Error(
      `pickRandomFromPool: count ${count} exceeds pool length ${pool.length}`,
    );
  }
  if (count === 0) return [];

  // Fisher–Yates shuffle on a copy, then take the first `count`.
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy.slice(0, count);
}
