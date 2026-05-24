/**
 * Skilldares — Random number generator.
 *
 * Pure modules (scoring, streak, picker, questionSelection) accept an Rng as
 * a parameter so tests can inject a deterministic generator. Production code
 * passes `defaultRng`, which is a thin wrapper around Math.random().
 */

/** Returns a number in [0, 1). */
export type Rng = () => number;

export const defaultRng: Rng = () => Math.random();
