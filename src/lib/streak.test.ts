import { describe, it, expect } from 'vitest';
import { nextStreak } from './streak';

describe('nextStreak', () => {
  describe('starting from 0 (no streak)', () => {
    it('goes to +1 on correct', () => {
      expect(nextStreak(0, true)).toBe(1);
    });

    it('goes to -1 on wrong', () => {
      expect(nextStreak(0, false)).toBe(-1);
    });
  });

  describe('continuing a positive streak', () => {
    it('+1 → +2 on correct', () => {
      expect(nextStreak(1, true)).toBe(2);
    });

    it('+2 → +3 on correct (crosses on-fire threshold)', () => {
      expect(nextStreak(2, true)).toBe(3);
    });

    it('+5 → +6 on correct', () => {
      expect(nextStreak(5, true)).toBe(6);
    });
  });

  describe('continuing a negative streak', () => {
    it('-1 → -2 on wrong', () => {
      expect(nextStreak(-1, false)).toBe(-2);
    });

    it('-2 → -3 on wrong (crosses doing-bad threshold)', () => {
      expect(nextStreak(-2, false)).toBe(-3);
    });

    it('-5 → -6 on wrong', () => {
      expect(nextStreak(-5, false)).toBe(-6);
    });
  });

  describe('resetting from positive to negative', () => {
    it('+1 → -1 on wrong', () => {
      expect(nextStreak(1, false)).toBe(-1);
    });

    it('+5 → -1 on wrong (does not become -6)', () => {
      expect(nextStreak(5, false)).toBe(-1);
    });

    it('+3 → -1 on wrong (ending on-fire streak)', () => {
      expect(nextStreak(3, false)).toBe(-1);
    });
  });

  describe('resetting from negative to positive', () => {
    it('-1 → +1 on correct', () => {
      expect(nextStreak(-1, true)).toBe(1);
    });

    it('-5 → +1 on correct (does not become +6 or -4)', () => {
      expect(nextStreak(-5, true)).toBe(1);
    });

    it('-3 → +1 on correct (ending doing-bad streak)', () => {
      expect(nextStreak(-3, true)).toBe(1);
    });
  });
});
