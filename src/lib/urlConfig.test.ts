import { describe, it, expect } from 'vitest';
import {
  parseGameConfigFromSearch,
  parseTestEndScreenFromSearch,
  DEFAULT_MC_COUNT,
  DEFAULT_SPEED_COUNT,
  DEFAULT_TEST_HIGH_SCORE,
  DEFAULT_TEST_END_SCORE,
  DEFAULT_TEST_CORRECT,
  DEFAULT_TEST_TOTAL,
} from './urlConfig';

const POOL_MAXES = { mc: 100, speed: 80 };

describe('parseGameConfigFromSearch', () => {
  describe('absent params', () => {
    it('returns defaults when search is empty', () => {
      expect(parseGameConfigFromSearch('', POOL_MAXES)).toEqual({
        mcCount: DEFAULT_MC_COUNT,
        speedCount: DEFAULT_SPEED_COUNT,
      });
    });

    it('returns defaults when search has unrelated params', () => {
      expect(parseGameConfigFromSearch('?utm_source=test', POOL_MAXES)).toEqual({
        mcCount: DEFAULT_MC_COUNT,
        speedCount: DEFAULT_SPEED_COUNT,
      });
    });

    it('uses default for the unspecified side', () => {
      expect(parseGameConfigFromSearch('?mc=3', POOL_MAXES)).toEqual({
        mcCount: 3,
        speedCount: DEFAULT_SPEED_COUNT,
      });
      expect(parseGameConfigFromSearch('?speed=2', POOL_MAXES)).toEqual({
        mcCount: DEFAULT_MC_COUNT,
        speedCount: 2,
      });
    });
  });

  describe('valid params', () => {
    it('parses both params', () => {
      expect(parseGameConfigFromSearch('?mc=3&speed=2', POOL_MAXES)).toEqual({
        mcCount: 3,
        speedCount: 2,
      });
    });

    it('allows 0 for a single section (skip that section)', () => {
      expect(parseGameConfigFromSearch('?mc=0&speed=5', POOL_MAXES)).toEqual({
        mcCount: 0,
        speedCount: 5,
      });
      expect(parseGameConfigFromSearch('?mc=5&speed=0', POOL_MAXES)).toEqual({
        mcCount: 5,
        speedCount: 0,
      });
    });
  });

  describe('clamping to pool sizes', () => {
    it('clamps mc to pool max', () => {
      expect(parseGameConfigFromSearch('?mc=9999', POOL_MAXES).mcCount).toBe(POOL_MAXES.mc);
    });

    it('clamps speed to pool max', () => {
      expect(parseGameConfigFromSearch('?speed=9999', POOL_MAXES).speedCount).toBe(
        POOL_MAXES.speed,
      );
    });

    it('clamps default down if pool is smaller than DEFAULT_MC_COUNT', () => {
      const tinyMaxes = { mc: 5, speed: 5 };
      expect(parseGameConfigFromSearch('', tinyMaxes)).toEqual({
        mcCount: 5,
        speedCount: 5,
      });
    });
  });

  describe('invalid input falls back', () => {
    it('falls back when mc is non-numeric', () => {
      expect(parseGameConfigFromSearch('?mc=abc&speed=2', POOL_MAXES)).toEqual({
        mcCount: DEFAULT_MC_COUNT,
        speedCount: 2,
      });
    });

    it('falls back when mc is negative', () => {
      expect(parseGameConfigFromSearch('?mc=-5&speed=2', POOL_MAXES)).toEqual({
        mcCount: DEFAULT_MC_COUNT,
        speedCount: 2,
      });
    });

    it('falls back when mc is empty (?mc=&speed=2)', () => {
      expect(parseGameConfigFromSearch('?mc=&speed=2', POOL_MAXES)).toEqual({
        mcCount: DEFAULT_MC_COUNT,
        speedCount: 2,
      });
    });

    it('treats decimal mc as the integer part (parseInt)', () => {
      // ?mc=3.7 → parseInt('3.7', 10) → 3; intentional, keeps counts integer-typed.
      expect(parseGameConfigFromSearch('?mc=3.7', POOL_MAXES).mcCount).toBe(3);
    });
  });

  describe('total-zero fallback', () => {
    it('falls back to defaults when mc=0&speed=0', () => {
      expect(parseGameConfigFromSearch('?mc=0&speed=0', POOL_MAXES)).toEqual({
        mcCount: DEFAULT_MC_COUNT,
        speedCount: DEFAULT_SPEED_COUNT,
      });
    });

    it('does NOT fall back when only one side is 0', () => {
      expect(parseGameConfigFromSearch('?mc=0&speed=1', POOL_MAXES)).toEqual({
        mcCount: 0,
        speedCount: 1,
      });
    });
  });
});

describe('parseTestEndScreenFromSearch', () => {
  describe('null (no activator)', () => {
    it('returns null when neither ?highScore nor ?endScreen is present', () => {
      expect(parseTestEndScreenFromSearch('')).toBeNull();
      expect(parseTestEndScreenFromSearch('?utm_source=x')).toBeNull();
      expect(parseTestEndScreenFromSearch('?mc=5&speed=2')).toBeNull();
    });

    it('returns null when only ?correct + ?total are given (no activator)', () => {
      expect(parseTestEndScreenFromSearch('?correct=10&total=20')).toBeNull();
    });
  });

  describe('?highScore → celebrating variant', () => {
    it('returns variant: "celebrating"', () => {
      expect(parseTestEndScreenFromSearch('?highScore=42')?.variant).toBe('celebrating');
    });

    it('returns config with parsed score when ?highScore=N is given', () => {
      expect(parseTestEndScreenFromSearch('?highScore=42')?.finalScore).toBe(42);
      expect(parseTestEndScreenFromSearch('?highScore=999')?.finalScore).toBe(999);
    });

    it('returns config with finalScore=0 when ?highScore=0', () => {
      expect(parseTestEndScreenFromSearch('?highScore=0')?.finalScore).toBe(0);
    });

    it('uses the default score when ?highScore is present without a value', () => {
      expect(parseTestEndScreenFromSearch('?highScore')?.finalScore).toBe(DEFAULT_TEST_HIGH_SCORE);
      expect(parseTestEndScreenFromSearch('?highScore=')?.finalScore).toBe(DEFAULT_TEST_HIGH_SCORE);
    });

    it('uses the default for invalid score values (non-numeric, negative)', () => {
      expect(parseTestEndScreenFromSearch('?highScore=abc')?.finalScore).toBe(DEFAULT_TEST_HIGH_SCORE);
      expect(parseTestEndScreenFromSearch('?highScore=-5')?.finalScore).toBe(DEFAULT_TEST_HIGH_SCORE);
    });

    it('parses an integer when given a decimal (parseInt truncation)', () => {
      expect(parseTestEndScreenFromSearch('?highScore=42.9')?.finalScore).toBe(42);
    });

    it('co-exists with other params', () => {
      expect(parseTestEndScreenFromSearch('?mc=3&highScore=77&speed=2')?.finalScore).toBe(77);
    });
  });

  describe('?endScreen → standard variant', () => {
    it('returns variant: "standard"', () => {
      expect(parseTestEndScreenFromSearch('?endScreen=42')?.variant).toBe('standard');
    });

    it('returns config with parsed score when ?endScreen=N is given', () => {
      expect(parseTestEndScreenFromSearch('?endScreen=42')?.finalScore).toBe(42);
      expect(parseTestEndScreenFromSearch('?endScreen=999')?.finalScore).toBe(999);
    });

    it('returns config with finalScore=0 when ?endScreen=0', () => {
      expect(parseTestEndScreenFromSearch('?endScreen=0')?.finalScore).toBe(0);
    });

    it('uses the default score when ?endScreen is present without a value', () => {
      expect(parseTestEndScreenFromSearch('?endScreen')?.finalScore).toBe(DEFAULT_TEST_END_SCORE);
      expect(parseTestEndScreenFromSearch('?endScreen=')?.finalScore).toBe(DEFAULT_TEST_END_SCORE);
    });

    it('uses the default for invalid score values (non-numeric, negative)', () => {
      expect(parseTestEndScreenFromSearch('?endScreen=abc')?.finalScore).toBe(DEFAULT_TEST_END_SCORE);
      expect(parseTestEndScreenFromSearch('?endScreen=-5')?.finalScore).toBe(DEFAULT_TEST_END_SCORE);
    });

    it('co-exists with other params', () => {
      expect(parseTestEndScreenFromSearch('?mc=3&endScreen=77&speed=2')?.finalScore).toBe(77);
    });
  });

  describe('precedence', () => {
    it('?highScore wins when both ?highScore and ?endScreen are present', () => {
      const cfg = parseTestEndScreenFromSearch('?highScore=80&endScreen=20');
      expect(cfg?.variant).toBe('celebrating');
      expect(cfg?.finalScore).toBe(80);
    });
  });

  describe('correctCount + totalQuestions (override the grade display)', () => {
    it('uses the defaults when only ?highScore is given', () => {
      const cfg = parseTestEndScreenFromSearch('?highScore=42');
      expect(cfg?.correctCount).toBe(DEFAULT_TEST_CORRECT);
      expect(cfg?.totalQuestions).toBe(DEFAULT_TEST_TOTAL);
    });

    it('uses the defaults when only ?endScreen is given', () => {
      const cfg = parseTestEndScreenFromSearch('?endScreen=42');
      expect(cfg?.correctCount).toBe(DEFAULT_TEST_CORRECT);
      expect(cfg?.totalQuestions).toBe(DEFAULT_TEST_TOTAL);
    });

    it('reads ?correct=N override (highScore)', () => {
      const cfg = parseTestEndScreenFromSearch('?highScore=42&correct=21');
      expect(cfg?.correctCount).toBe(21);
      expect(cfg?.totalQuestions).toBe(DEFAULT_TEST_TOTAL);
    });

    it('reads ?correct=N override (endScreen)', () => {
      const cfg = parseTestEndScreenFromSearch('?endScreen=42&correct=21');
      expect(cfg?.correctCount).toBe(21);
      expect(cfg?.totalQuestions).toBe(DEFAULT_TEST_TOTAL);
    });

    it('reads ?total=M override', () => {
      const cfg = parseTestEndScreenFromSearch('?highScore=42&total=20');
      expect(cfg?.correctCount).toBe(DEFAULT_TEST_CORRECT);
      expect(cfg?.totalQuestions).toBe(20);
    });

    it('reads both ?correct + ?total together', () => {
      const cfg = parseTestEndScreenFromSearch('?highScore=42&correct=15&total=30');
      expect(cfg?.correctCount).toBe(15);
      expect(cfg?.totalQuestions).toBe(30);
    });

    it('accepts 0 for both (renders grade F)', () => {
      const cfg = parseTestEndScreenFromSearch('?highScore=42&correct=0&total=30');
      expect(cfg?.correctCount).toBe(0);
      expect(cfg?.totalQuestions).toBe(30);
    });

    it('falls back to defaults for invalid values', () => {
      const cfg = parseTestEndScreenFromSearch('?highScore=42&correct=abc&total=-5');
      expect(cfg?.correctCount).toBe(DEFAULT_TEST_CORRECT);
      expect(cfg?.totalQuestions).toBe(DEFAULT_TEST_TOTAL);
    });
  });
});
