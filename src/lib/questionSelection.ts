/**
 * Skilldares — Question selection.
 *
 * Pure modules for building a game's question set. Three exports:
 *
 *  - pickRandomFromPool<T>(pool, count, rng)  — Fisher-Yates draw without replacement
 *  - shuffleMCQuestion(question, rng)         — shuffle an MC question's options + remap correctIndex/funnyWrongIndex (FR9.1)
 *  - selectGameQuestions(allMC, allOrder, allSelect, rng) — build a 30-round game (FR2 / FR3)
 */

import type { Rng } from './rng';
import type {
  GameQuestion,
  MultipleChoiceQuestion,
  SpeedOrderQuestion,
  SpeedSelectQuestion,
} from './schemas/question.schema';

// ---------- Generic random-without-replacement helper ----------

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

// ---------- MC option shuffling (FR9.1) ----------

/**
 * Fisher-Yates shuffle of an MC question's options, with correctIndex and
 * funnyWrongIndex remapped to track their options' new positions. Prevents
 * the authored "correctIndex: 0" convention from making the upper-left
 * quadrant always correct.
 */
export function shuffleMCQuestion(
  question: MultipleChoiceQuestion,
  rng: Rng,
): MultipleChoiceQuestion {
  const pairs = question.options.map((opt, i) => ({ opt, originalIndex: i }));
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j]!, pairs[i]!];
  }
  return {
    ...question,
    options: pairs.map((p) => p.opt),
    correctIndex: pairs.findIndex((p) => p.originalIndex === question.correctIndex),
    funnyWrongIndex: pairs.findIndex((p) => p.originalIndex === question.funnyWrongIndex),
  };
}

// ---------- Full-game selector (FR2 / FR3) ----------

const MC_COUNT = 15;
const TOTAL_SPEED = 15;

/**
 * Builds a full 30-round game.
 *
 * Per FR2: rounds 1-15 are MC, rounds 16-30 are speed.
 * Per FR3: speed rounds split ~50/50 (±1) between Type A (drag-order) and
 *          Type B (multi-select).
 *
 * Each MC question's options are shuffled (per FR9.1) so the correct
 * answer doesn't always land in the same quadrant.
 *
 * Speed-round mix is interleaved randomly within rounds 16-30 (no
 * deterministic A-then-B order — the player shouldn't be able to predict
 * type from round number).
 */
export function selectGameQuestions(
  allMC: MultipleChoiceQuestion[],
  allOrder: SpeedOrderQuestion[],
  allSelect: SpeedSelectQuestion[],
  rng: Rng,
): GameQuestion[] {
  // Random 7/8 or 8/7 split for the 15 speed rounds.
  const speedACount = rng() < 0.5 ? 7 : 8;
  const speedBCount = TOTAL_SPEED - speedACount;

  // MC rounds: pick 15 + shuffle each question's options.
  const mcSelected = pickRandomFromPool(allMC, MC_COUNT, rng);
  const mcRounds: GameQuestion[] = mcSelected.map((q) => ({
    type: 'mc' as const,
    question: shuffleMCQuestion(q, rng),
  }));

  // Speed rounds: pick N each, wrap, interleave randomly.
  const speedASelected = pickRandomFromPool(allOrder, speedACount, rng);
  const speedBSelected = pickRandomFromPool(allSelect, speedBCount, rng);
  const speedWrapped: GameQuestion[] = [
    ...speedASelected.map((q) => ({ type: 'order' as const, question: q })),
    ...speedBSelected.map((q) => ({ type: 'select' as const, question: q })),
  ];
  // Shuffle by drawing all of them via pickRandomFromPool with count=length.
  const speedShuffled = pickRandomFromPool(speedWrapped, speedWrapped.length, rng);

  return [...mcRounds, ...speedShuffled];
}
