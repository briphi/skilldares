import { describe, it, expect } from 'vitest';
import { pickRandomFromPool } from './questionSelection';

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
