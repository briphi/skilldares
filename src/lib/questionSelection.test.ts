import { describe, it, expect } from 'vitest';
import { pickRandomFromPool, selectGameQuestions, shuffleMCQuestion } from './questionSelection';
import type {
  MultipleChoiceQuestion,
  SpeedOrderQuestion,
  SpeedSelectQuestion,
} from './schemas/question.schema';

/**
 * Deterministic Rng helper for tests: cycles through a fixed sequence.
 * Always returns 0.5 for predictable Fisher-Yates behavior in some tests.
 */
function fixedRng(value: number): () => number {
  return () => value;
}

function sequenceRng(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length]!;
}

describe('pickRandomFromPool', () => {
  const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  it('returns exactly N items', () => {
    const result = pickRandomFromPool(pool, 5, fixedRng(0.5));
    expect(result).toHaveLength(5);
  });

  it('returns 0 items when count is 0', () => {
    expect(pickRandomFromPool(pool, 0, fixedRng(0.5))).toEqual([]);
  });

  it('all returned items are from the original pool', () => {
    const result = pickRandomFromPool(pool, 5, fixedRng(0.3));
    for (const item of result) {
      expect(pool).toContain(item);
    }
  });

  it('returns no duplicates (without-replacement guarantee)', () => {
    const result = pickRandomFromPool(pool, 10, sequenceRng([0.1, 0.3, 0.5, 0.7, 0.9]));
    const unique = new Set(result);
    expect(unique.size).toBe(result.length);
  });

  it('returns a permutation of the whole pool when count === pool.length', () => {
    const result = pickRandomFromPool(pool, pool.length, sequenceRng([0.1, 0.4, 0.7, 0.2]));
    expect(result).toHaveLength(pool.length);
    expect([...result].sort((a, b) => a - b)).toEqual([...pool].sort((a, b) => a - b));
  });

  it('does not mutate the input pool', () => {
    const original = [...pool];
    pickRandomFromPool(pool, 5, fixedRng(0.5));
    expect(pool).toEqual(original);
  });

  it('returns deterministic output for a deterministic rng', () => {
    const a = pickRandomFromPool(pool, 5, sequenceRng([0.1, 0.3, 0.5, 0.7, 0.9]));
    const b = pickRandomFromPool(pool, 5, sequenceRng([0.1, 0.3, 0.5, 0.7, 0.9]));
    expect(a).toEqual(b);
  });

  it('throws when count > pool.length', () => {
    expect(() => pickRandomFromPool(pool, 11, fixedRng(0.5))).toThrow(/exceeds pool length/);
  });

  it('throws when count is negative', () => {
    expect(() => pickRandomFromPool(pool, -1, fixedRng(0.5))).toThrow(/count must be >= 0/);
  });

  it('works with strings (generic over T)', () => {
    const stringPool = ['apple', 'banana', 'cherry'];
    const result = pickRandomFromPool(stringPool, 2, fixedRng(0.5));
    expect(result).toHaveLength(2);
    for (const item of result) {
      expect(stringPool).toContain(item);
    }
  });
});

// ---------- shuffleMCQuestion (moved from gameSetup in Story 2.3) ----------

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

  it('moves the correct answer off position 0 for rng=()=>0', () => {
    const shuffled = shuffleMCQuestion(canonical, () => 0);
    expect(shuffled.correctIndex).not.toBe(0);
  });

  it('preserves prompt and menuRefs', () => {
    const shuffled = shuffleMCQuestion(canonical, () => 0.5);
    expect(shuffled.prompt).toBe(canonical.prompt);
    expect(shuffled.menuRefs).toEqual(canonical.menuRefs);
  });
});

// ---------- selectGameQuestions (FR2 / FR3 30-round selector) ----------

function makeMCFixture(i: number): MultipleChoiceQuestion {
  return {
    prompt: `MC ${i}`,
    options: ['a', 'b', 'c', 'd'],
    correctIndex: 0,
    funnyWrongIndex: 1,
    menuRefs: [],
  };
}

function makeOrderFixture(i: number): SpeedOrderQuestion {
  return {
    prompt: `Order ${i}`,
    factor: 'price',
    items: [
      { name: 'x', factorValue: 1 },
      { name: 'y', factorValue: 2 },
      { name: 'z', factorValue: 3 },
    ],
    menuRefs: [],
  };
}

function makeSelectFixture(i: number): SpeedSelectQuestion {
  return {
    prompt: `Select ${i}`,
    criteriaType: 'items-in-dish',
    items: ['a', 'b', 'c', 'd', 'e'],
    correctSet: ['a'],
    menuRefs: [],
  };
}

describe('selectGameQuestions', () => {
  const allMC = Array.from({ length: 20 }, (_, i) => makeMCFixture(i));
  const allOrder = Array.from({ length: 12 }, (_, i) => makeOrderFixture(i));
  const allSelect = Array.from({ length: 12 }, (_, i) => makeSelectFixture(i));

  it('returns exactly 30 questions', () => {
    const game = selectGameQuestions(allMC, allOrder, allSelect, () => 0.5);
    expect(game).toHaveLength(30);
  });

  it('first 15 are all type=mc', () => {
    const game = selectGameQuestions(allMC, allOrder, allSelect, () => 0.5);
    for (let i = 0; i < 15; i++) {
      expect(game[i]!.type).toBe('mc');
    }
  });

  it('last 15 are all type=order or type=select', () => {
    const game = selectGameQuestions(allMC, allOrder, allSelect, () => 0.5);
    for (let i = 15; i < 30; i++) {
      expect(['order', 'select']).toContain(game[i]!.type);
    }
  });

  it('speed rounds split 7+8 = 15 (FR3 50/50 ±1)', () => {
    const game = selectGameQuestions(allMC, allOrder, allSelect, () => 0.5);
    const speed = game.slice(15);
    const aCount = speed.filter((g) => g.type === 'order').length;
    const bCount = speed.filter((g) => g.type === 'select').length;
    expect(aCount + bCount).toBe(15);
    expect([7, 8]).toContain(aCount);
    expect([7, 8]).toContain(bCount);
  });

  it('is deterministic for a given rng (same sequence)', () => {
    // Use a sequence rng so each call returns the next value (true deterministic playback).
    const game1 = selectGameQuestions(allMC, allOrder, allSelect, sequenceRng([0.1, 0.3, 0.5, 0.7, 0.9]));
    const game2 = selectGameQuestions(allMC, allOrder, allSelect, sequenceRng([0.1, 0.3, 0.5, 0.7, 0.9]));
    expect(game1.map((g) => g.type)).toEqual(game2.map((g) => g.type));
  });

  it('includes BOTH speed types in the output', () => {
    const game = selectGameQuestions(allMC, allOrder, allSelect, () => 0.5);
    const speed = game.slice(15);
    expect(speed.some((g) => g.type === 'order')).toBe(true);
    expect(speed.some((g) => g.type === 'select')).toBe(true);
  });

  it('rng < 0.5 gives speedA=7, rng >= 0.5 gives speedA=8 (deterministic split)', () => {
    // rng()=>0 always returns 0 (< 0.5) → speedA=7
    const lowRng = selectGameQuestions(allMC, allOrder, allSelect, () => 0);
    const lowSpeed = lowRng.slice(15);
    expect(lowSpeed.filter((g) => g.type === 'order').length).toBe(7);

    // rng()=>0.9 always returns 0.9 (>= 0.5) → speedA=8
    const highRng = selectGameQuestions(allMC, allOrder, allSelect, () => 0.9);
    const highSpeed = highRng.slice(15);
    expect(highSpeed.filter((g) => g.type === 'order').length).toBe(8);
  });
});
