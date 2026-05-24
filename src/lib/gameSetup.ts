import type { GameQuestion } from './gameReducer';
import { pickRandomFromPool } from './questionSelection';
import type { Rng } from './rng';
import type { MultipleChoiceQuestion } from './schemas/question.schema';

/**
 * Skilldares — Epic 1 question selector.
 *
 * Selects 15 MC questions for the Epic 1 milestone (MC-only game).
 * Story 2.3's `selectGameQuestions(allMC, allOrder, allSelect, rng)`
 * will replace this with the full FR2/FR3-compliant 30-round (15 MC +
 * 15 speed) selector once Speed Type A and Type B components ship.
 *
 * Each selected MC question has its options shuffled (per-game, per-question)
 * so the correct answer doesn't always land in the same quadrant — the
 * authored content has correctIndex=0 / funnyWrongIndex=2 for most questions,
 * which would otherwise let a player win by always tapping the top-left.
 */
const EPIC_1_ROUND_COUNT = 15;

/**
 * Fisher-Yates shuffle of an MC question's options, with correctIndex and
 * funnyWrongIndex remapped to track their options' new positions.
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

export function selectEpic1Game(mcPool: MultipleChoiceQuestion[], rng: Rng): GameQuestion[] {
  const selected = pickRandomFromPool(mcPool, EPIC_1_ROUND_COUNT, rng);
  return selected.map((question) => ({
    type: 'mc' as const,
    question: shuffleMCQuestion(question, rng),
  }));
}
