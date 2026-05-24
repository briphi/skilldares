/**
 * Skilldares — URL-driven game configuration.
 *
 * Optional ?mc=N&speed=N query params let testers shorten a game without
 * a code change. Invalid input silently falls back to defaults — this is
 * intentional, not a UX gap. The URL config is a dev-test affordance,
 * not a user-facing feature.
 */

export type GameRoundCounts = {
  mcCount: number;
  speedCount: number;
};

export const DEFAULT_MC_COUNT = 15;
export const DEFAULT_SPEED_COUNT = 15;

/**
 * Parse round counts from the URL query string.
 *
 * - `?mc=N` overrides the number of multiple-choice rounds.
 * - `?speed=N` overrides the number of speed rounds (the Type-A / Type-B
 *   ~50/50 split is still applied within that count).
 * - Each is clamped to `[0, maxes.<section>]` (the question-pool size).
 * - Invalid (missing, non-numeric, negative) values fall back to the
 *   defaults (15 each).
 * - If the resulting total would be 0, both fall back to defaults — a
 *   zero-question game would crash the reducer's round-advance logic.
 */
export function parseGameConfigFromSearch(
  search: string,
  maxes: { mc: number; speed: number },
): GameRoundCounts {
  const params = new URLSearchParams(search);
  const mcCount = parseSingleCount(params.get('mc'), DEFAULT_MC_COUNT, maxes.mc);
  const speedCount = parseSingleCount(params.get('speed'), DEFAULT_SPEED_COUNT, maxes.speed);

  if (mcCount + speedCount === 0) {
    return {
      mcCount: Math.min(DEFAULT_MC_COUNT, maxes.mc),
      speedCount: Math.min(DEFAULT_SPEED_COUNT, maxes.speed),
    };
  }
  return { mcCount, speedCount };
}

function parseSingleCount(raw: string | null, fallback: number, max: number): number {
  if (raw === null) return Math.min(fallback, max);
  const parsed = parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return Math.min(fallback, max);
  return Math.min(parsed, max);
}

/** Default finalScore when `?highScore` is present without a value. */
export const DEFAULT_TEST_HIGH_SCORE = 100;

/**
 * Parse the optional `?highScore` URL parameter — a dev-test affordance
 * that jumps straight to the celebrating End screen variant (skipping
 * the start screen and the actual gameplay).
 *
 * Returns:
 *   - the parsed score when `?highScore=N` is given with a non-negative N
 *   - DEFAULT_TEST_HIGH_SCORE when the param is present without a value
 *     (e.g. `?highScore` or `?highScore=`) or with an invalid value
 *   - null when the param is absent (no jump)
 *
 * The End screen rendered in this mode does NOT write to localStorage,
 * so testing the celebration doesn't pollute the player's real high
 * score. Tapping "Play Again" leaves the test screen and starts a
 * real game.
 */
export function parseTestHighScoreFromSearch(search: string): number | null {
  const params = new URLSearchParams(search);
  if (!params.has('highScore')) return null;
  const raw = params.get('highScore');
  if (raw === null || raw === '') return DEFAULT_TEST_HIGH_SCORE;
  const parsed = parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_TEST_HIGH_SCORE;
  return parsed;
}
