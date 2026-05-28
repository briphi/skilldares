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

export type SelectGameQuestionsOptions = {
  /** Override the MC round count (defaults to 15). Clamped to pool size. */
  mcCount?: number;
  /** Override the total speed round count (defaults to 15). Clamped to pool sizes combined. The A/B split is still ~50/50. */
  speedCount?: number;
};

/**
 * Builds a game of MC rounds + speed rounds.
 *
 * All question types are shuffled together into one interleaved
 * sequence — MC, drag-order, and multi-select rounds appear in random
 * order across the whole game (supersedes the original FR2 "MC first,
 * then speed" ordering). The player can't predict the type of the next
 * round from its position.
 *
 * Per FR3: speed rounds still split ~50/50 (±1) between Type A
 *          (drag-order) and Type B (multi-select). This controls the
 *          COUNT of each speed type, independent of ordering.
 *
 * Each MC question's options are shuffled (per FR9.1) so the correct
 * answer doesn't always land in the same quadrant.
 *
 * Default round counts are 15/15 (the v1 production game). Optional
 * `options.mcCount` / `options.speedCount` allow shorter games for
 * testing (see ?mc=N&speed=N URL params wired in App.tsx).
 */
export function selectGameQuestions(
  allMC: MultipleChoiceQuestion[],
  allOrder: SpeedOrderQuestion[],
  allSelect: SpeedSelectQuestion[],
  rng: Rng,
  options?: SelectGameQuestionsOptions,
): GameQuestion[] {
  const mcCount = Math.min(options?.mcCount ?? MC_COUNT, allMC.length);
  const speedTotal = Math.min(
    options?.speedCount ?? TOTAL_SPEED,
    allOrder.length + allSelect.length,
  );

  // ~50/50 A/B split for any speedTotal, including 0 and 1.
  // Even count → equal halves. Odd count → the extra randomly goes to A or B.
  // Polarity matches the prior `rng() < 0.5 ? 7 : 8` convention so existing
  // tests (and any rng-based determinism elsewhere) keep their meaning.
  const baseA = Math.floor(speedTotal / 2);
  const extraToA = speedTotal % 2 === 1 && rng() >= 0.5;
  const speedACount = Math.min(baseA + (extraToA ? 1 : 0), allOrder.length);
  const speedBCount = Math.min(speedTotal - speedACount, allSelect.length);

  // MC rounds: pick N + shuffle each question's options.
  const mcSelected = pickRandomFromPool(allMC, mcCount, rng);
  const mcRounds: GameQuestion[] = mcSelected.map((q) => ({
    type: 'mc' as const,
    question: shuffleMCQuestion(q, rng),
  }));

  // Speed rounds: pick N of each type.
  const speedASelected = pickRandomFromPool(allOrder, speedACount, rng);
  const speedBSelected = pickRandomFromPool(allSelect, speedBCount, rng);
  const speedRounds: GameQuestion[] = [
    ...speedASelected.map((q) => ({ type: 'order' as const, question: q })),
    ...speedBSelected.map((q) => ({ type: 'select' as const, question: q })),
  ];

  // Shuffle MC + speed rounds all together so the question types are
  // interleaved across the whole game rather than grouped MC-then-speed.
  // Drawing count=length via pickRandomFromPool is a full Fisher-Yates.
  const allRounds = [...mcRounds, ...speedRounds];
  return pickRandomFromPool(allRounds, allRounds.length, rng);
}
