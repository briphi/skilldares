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

/** Defaults when the matching ?param is absent / empty / invalid. */
export const DEFAULT_TEST_HIGH_SCORE = 100;
export const DEFAULT_TEST_END_SCORE = 50;
export const DEFAULT_TEST_CORRECT = 28;
export const DEFAULT_TEST_TOTAL = 30;

/**
 * Tagged union — the parser picks which variant to render based on
 * which param is present. `?highScore` wins if both are given.
 */
export type TestEndScreenConfig =
  | {
      variant: 'celebrating';
      finalScore: number;
      correctCount: number;
      totalQuestions: number;
    }
  | {
      variant: 'standard';
      finalScore: number;
      correctCount: number;
      totalQuestions: number;
    };

/**
 * Parse the optional dev-test End-screen jump params:
 *
 *   ?highScore[=N]   → CELEBRATING variant (new-high-score path)
 *   ?endScreen[=N]   → STANDARD variant (didn't beat your PB)
 *
 * Either activates a short-circuit in App.tsx that renders EndScreen
 * directly from the Start phase, skipping gameplay entirely. Both
 * also accept the optional shared overrides:
 *
 *   &correct=N   → override correctCount   (default 28)
 *   &total=M     → override totalQuestions (default 30)
 *
 * Returns null when neither activator param is present. When both
 * `highScore` and `endScreen` are given, `highScore` wins.
 *
 * The End screen rendered in either test mode does NOT write to
 * localStorage, so testing doesn't pollute the player's real high
 * score. Tapping "Play Again" leaves the test screen and starts a
 * real game.
 */
export function parseTestEndScreenFromSearch(
  search: string,
): TestEndScreenConfig | null {
  const params = new URLSearchParams(search);
  const correctCount = parsePositiveInt(params.get('correct'), DEFAULT_TEST_CORRECT);
  const totalQuestions = parsePositiveInt(params.get('total'), DEFAULT_TEST_TOTAL);

  if (params.has('highScore')) {
    return {
      variant: 'celebrating',
      finalScore: parsePositiveInt(params.get('highScore'), DEFAULT_TEST_HIGH_SCORE),
      correctCount,
      totalQuestions,
    };
  }
  if (params.has('endScreen')) {
    return {
      variant: 'standard',
      finalScore: parsePositiveInt(params.get('endScreen'), DEFAULT_TEST_END_SCORE),
      correctCount,
      totalQuestions,
    };
  }
  return null;
}

function parsePositiveInt(raw: string | null, fallback: number): number {
  if (raw === null || raw === '') return fallback;
  const parsed = parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}
