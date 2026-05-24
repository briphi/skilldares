import { describe, it, expect } from 'vitest';
import { computePoints } from './scoring';

describe('computePoints', () => {
  it('awards 5 points for a correct answer without hint', () => {
    expect(computePoints(true, false)).toBe(5);
  });

  it('awards 2 points for a correct answer with hint used', () => {
    expect(computePoints(true, true)).toBe(2);
  });

  it('awards 0 points for a wrong answer (no hint)', () => {
    expect(computePoints(false, false)).toBe(0);
  });

  it('awards 0 points for a wrong answer even when hint was used', () => {
    // Hint flag should be irrelevant on wrong answers; FR32 says wrong is wrong.
    expect(computePoints(false, true)).toBe(0);
  });
});
