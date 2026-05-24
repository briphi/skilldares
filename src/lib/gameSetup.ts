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
 */
const EPIC_1_ROUND_COUNT = 15;

export function selectEpic1Game(mcPool: MultipleChoiceQuestion[], rng: Rng): GameQuestion[] {
  const selected = pickRandomFromPool(mcPool, EPIC_1_ROUND_COUNT, rng);
  return selected.map((question) => ({ type: 'mc' as const, question }));
}
