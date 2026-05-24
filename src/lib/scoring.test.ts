import { describe, it, expect } from 'vitest';
import { computePoints, STREAK_BONUS_THRESHOLD } from './scoring';

describe('computePoints', () => {
  describe('base scoring (no streak)', () => {
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

  describe('streak bonus', () => {
    it('awards +1 streak bonus on a correct (no hint) when streak meets threshold', () => {
      expect(computePoints(true, false, STREAK_BONUS_THRESHOLD)).toBe(6);
    });

    it('awards +1 streak bonus on a correct (hint used) when streak meets threshold', () => {
      expect(computePoints(true, true, STREAK_BONUS_THRESHOLD)).toBe(3);
    });

    it('awards +1 streak bonus at higher streaks too', () => {
      expect(computePoints(true, false, 10)).toBe(6);
      expect(computePoints(true, true, 10)).toBe(3);
    });

    it('does NOT award the bonus below the threshold', () => {
      expect(computePoints(true, false, STREAK_BONUS_THRESHOLD - 1)).toBe(5);
      expect(computePoints(true, true, STREAK_BONUS_THRESHOLD - 1)).toBe(2);
    });

    it('does NOT award the bonus for streak 0 (default)', () => {
      expect(computePoints(true, false, 0)).toBe(5);
    });

    it('does NOT award the bonus on a wrong answer regardless of streak', () => {
      // A wrong answer would have reset/inverted the streak anyway, but guard the
      // contract: bonus requires isCorrect=true.
      expect(computePoints(false, false, 999)).toBe(0);
      expect(computePoints(false, true, 999)).toBe(0);
    });
  });
});
