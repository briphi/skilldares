import type { GameQuestion } from './gameReducer';
import { pickRandomFromPool, shuffleMCQuestion } from './questionSelection';
import type { Rng } from './rng';
import type { MultipleChoiceQuestion } from './schemas/question.schema';

/**
 * Skilldares — Epic 1 question selector.
 *
 * Selects 15 MC questions for the Epic 1 milestone (MC-only game).
 * Story 2.3 ships `selectGameQuestions(allMC, allOrder, allSelect, rng)`
 * (in questionSelection.ts) — the full FR2/FR3-compliant 30-round (15 MC +
 * 15 speed) selector. Story 2.8 will retire this function and switch
 * App.tsx to selectGameQuestions once speed components ship.
 *
 * Each selected MC question has its options shuffled (per-game, per-question)
 * via shuffleMCQuestion (moved to questionSelection.ts in Story 2.3).
 */
const EPIC_1_ROUND_COUNT = 15;

// Re-export for backward compat with existing call sites + tests.
export { shuffleMCQuestion };

export function selectEpic1Game(mcPool: MultipleChoiceQuestion[], rng: Rng): GameQuestion[] {
  const selected = pickRandomFromPool(mcPool, EPIC_1_ROUND_COUNT, rng);
  return selected.map((question) => ({
    type: 'mc' as const,
    question: shuffleMCQuestion(question, rng),
  }));
}
