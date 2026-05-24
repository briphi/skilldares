import { describe, it, expect } from 'vitest';
import { selectEpic1Game, shuffleMCQuestion } from './gameSetup';
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

describe('shuffleMCQuestion', () => {
  const canonical: MultipleChoiceQuestion = {
    prompt: 'Test',
    options: ['Correct', 'DistA', 'Funny', 'DistB'],
    correctIndex: 0,
    funnyWrongIndex: 2,
    menuRefs: [],
  };

  it('preserves the option set (no losses, no dupes)', () => {
    const shuffled = shuffleMCQuestion(canonical, () => 0.5);
    expect([...shuffled.options].sort()).toEqual([...canonical.options].sort());
  });

  it('remaps correctIndex to the new position of "Correct"', () => {
    const shuffled = shuffleMCQuestion(canonical, () => 0.5);
    expect(shuffled.options[shuffled.correctIndex]).toBe('Correct');
  });

  it('remaps funnyWrongIndex to the new position of "Funny"', () => {
    const shuffled = shuffleMCQuestion(canonical, () => 0.5);
    expect(shuffled.options[shuffled.funnyWrongIndex]).toBe('Funny');
  });

  it('moves the correct answer off position 0 for a typical rng (rng=()=>0 reverses 4-element arrays)', () => {
    // With rng()=>0, Fisher-Yates swaps element-3↔0, then 2↔0, then 1↔0.
    // [Correct, DistA, Funny, DistB] → [DistA, Funny, DistB, Correct]
    const shuffled = shuffleMCQuestion(canonical, () => 0);
    expect(shuffled.correctIndex).not.toBe(0);
  });

  it('preserves prompt and menuRefs', () => {
    const shuffled = shuffleMCQuestion(canonical, () => 0.5);
    expect(shuffled.prompt).toBe(canonical.prompt);
    expect(shuffled.menuRefs).toEqual(canonical.menuRefs);
  });

  it('produces different positions across different rng sequences', () => {
    const a = shuffleMCQuestion(canonical, () => 0);
    const b = shuffleMCQuestion(canonical, () => 0.999);
    expect(a.options).not.toEqual(b.options);
  });
});

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
