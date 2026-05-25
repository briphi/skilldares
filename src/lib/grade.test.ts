import { describe, it, expect } from 'vitest';
import { computeGrade, gradeTier, type LetterGrade } from './grade';

describe('computeGrade', () => {
  describe('perfect / very high scores', () => {
    it('returns A+ at 100%', () => {
      expect(computeGrade(30, 30)).toBe('A+');
    });

    it('returns A+ at 97% boundary', () => {
      expect(computeGrade(97, 100)).toBe('A+');
    });

    it('returns A just below A+ (96%)', () => {
      expect(computeGrade(96, 100)).toBe('A');
    });

    it('returns A at 93% boundary', () => {
      expect(computeGrade(93, 100)).toBe('A');
    });

    it('returns A- at 90%', () => {
      expect(computeGrade(90, 100)).toBe('A-');
    });

    it('returns A- at 91%', () => {
      expect(computeGrade(91, 100)).toBe('A-');
    });
  });

  describe('B range', () => {
    it('returns B+ at 89%', () => {
      expect(computeGrade(89, 100)).toBe('B+');
    });

    it('returns B+ at 87% boundary', () => {
      expect(computeGrade(87, 100)).toBe('B+');
    });

    it('returns B at 86%', () => {
      expect(computeGrade(86, 100)).toBe('B');
    });

    it('returns B at 83% boundary', () => {
      expect(computeGrade(83, 100)).toBe('B');
    });

    it('returns B- at 80%', () => {
      expect(computeGrade(80, 100)).toBe('B-');
    });
  });

  describe('C / D / F ranges', () => {
    it('returns C+ at 77%', () => {
      expect(computeGrade(77, 100)).toBe('C+');
    });

    it('returns C at 75%', () => {
      expect(computeGrade(75, 100)).toBe('C');
    });

    it('returns C- at 70%', () => {
      expect(computeGrade(70, 100)).toBe('C-');
    });

    it('returns D+ at 67%', () => {
      expect(computeGrade(67, 100)).toBe('D+');
    });

    it('returns D at 65%', () => {
      expect(computeGrade(65, 100)).toBe('D');
    });

    it('returns D- at 60% boundary', () => {
      expect(computeGrade(60, 100)).toBe('D-');
    });

    it('returns F at 59%', () => {
      expect(computeGrade(59, 100)).toBe('F');
    });

    it('returns F at 0%', () => {
      expect(computeGrade(0, 100)).toBe('F');
    });
  });

  describe('30-round game (production)', () => {
    it('30/30 = A+', () => {
      expect(computeGrade(30, 30)).toBe('A+');
    });

    it('29/30 (96.7%) = A', () => {
      expect(computeGrade(29, 30)).toBe('A');
    });

    it('27/30 (90%) = A-', () => {
      expect(computeGrade(27, 30)).toBe('A-');
    });

    it('25/30 (83.3%) = B', () => {
      expect(computeGrade(25, 30)).toBe('B');
    });

    it('21/30 (70%) = C-', () => {
      expect(computeGrade(21, 30)).toBe('C-');
    });

    it('17/30 (56.7%) = F', () => {
      expect(computeGrade(17, 30)).toBe('F');
    });
  });

  describe('edge cases', () => {
    it('total === 0 → F (defensive)', () => {
      expect(computeGrade(0, 0)).toBe('F');
    });

    it('correct > total → still A+ (clamps via >= 97)', () => {
      expect(computeGrade(110, 100)).toBe('A+');
    });
  });
});

describe('gradeTier', () => {
  it('maps each grade to its letter tier (no modifier)', () => {
    const cases: Array<[LetterGrade, string]> = [
      ['A+', 'a'], ['A', 'a'], ['A-', 'a'],
      ['B+', 'b'], ['B', 'b'], ['B-', 'b'],
      ['C+', 'c'], ['C', 'c'], ['C-', 'c'],
      ['D+', 'd'], ['D', 'd'], ['D-', 'd'],
      ['F', 'f'],
    ];
    for (const [grade, expected] of cases) {
      expect(gradeTier(grade)).toBe(expected);
    }
  });
});
