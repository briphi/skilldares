import { describe, it, expect } from 'vitest';
import { selectEpic1Game } from './gameSetup';
import type { MultipleChoiceQuestion } from './schemas/question.schema';

function makeMCPool(count: number): MultipleChoiceQuestion[] {
  return Array.from({ length: count }, (_, i) => ({
    prompt: `Q${i}`,
    options: ['a', 'b', 'c', 'd'],
    correctIndex: 0,
    funnyWrongIndex: 1,
    menuRefs: [],
  }));
}

describe('selectEpic1Game', () => {
  it('returns exactly 15 questions', () => {
    const pool = makeMCPool(30);
    const game = selectEpic1Game(pool, () => 0.5);
    expect(game).toHaveLength(15);
  });

  it('wraps each selected question as { type: "mc", question }', () => {
    const pool = makeMCPool(20);
    const game = selectEpic1Game(pool, () => 0.5);
    for (const entry of game) {
      expect(entry.type).toBe('mc');
      // Narrow the discriminated union before accessing MC-only fields.
      if (entry.type !== 'mc') throw new Error('expected MC entry');
      expect(entry.question).toBeTruthy();
      expect(entry.question.options).toHaveLength(4);
    }
  });

  it('uses the injected rng deterministically (same rng → same picks)', () => {
    const pool = makeMCPool(50);
    const fixedRng = () => 0.5;
    const game1 = selectEpic1Game(pool, fixedRng);
    const game2 = selectEpic1Game(pool, fixedRng);
    expect(game1.map((g) => g.question.prompt)).toEqual(game2.map((g) => g.question.prompt));
  });
});

// shuffleMCQuestion's unit tests moved to questionSelection.test.ts in Story 2.3
// (the function moved with them — gameSetup.ts re-exports for back-compat).

describe('selectEpic1Game — options shuffling integration', () => {
  it('does not leave correctIndex at 0 for every question', () => {
    // Construct a pool where every question has correctIndex=0 and verify
    // that after selection, NOT every game question has correctIndex=0.
    const pool: MultipleChoiceQuestion[] = Array.from({ length: 30 }, (_, i) => ({
      prompt: `Q${i}`,
      options: ['Correct', 'A', 'Funny', 'B'],
      correctIndex: 0,
      funnyWrongIndex: 2,
      menuRefs: [],
    }));
    const game = selectEpic1Game(pool, Math.random);
    const correctIndices = game.map((g) =>
      g.type === 'mc' ? g.question.correctIndex : -1,
    );
    // Should be a spread across positions 0-3, not all 0.
    const unique = new Set(correctIndices);
    expect(unique.size).toBeGreaterThan(1);
  });
});
