import { describe, it, expect } from 'vitest';
import {
  parseGameConfigFromSearch,
  parseTestHighScoreFromSearch,
  DEFAULT_MC_COUNT,
  DEFAULT_SPEED_COUNT,
  DEFAULT_TEST_HIGH_SCORE,
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

describe('parseTestHighScoreFromSearch', () => {
  it('returns null when the param is absent', () => {
    expect(parseTestHighScoreFromSearch('')).toBeNull();
    expect(parseTestHighScoreFromSearch('?utm_source=x')).toBeNull();
    expect(parseTestHighScoreFromSearch('?mc=5&speed=2')).toBeNull();
  });

  it('returns the parsed score when ?highScore=N is given', () => {
    expect(parseTestHighScoreFromSearch('?highScore=42')).toBe(42);
    expect(parseTestHighScoreFromSearch('?highScore=999')).toBe(999);
  });

  it('returns 0 when ?highScore=0 (valid non-negative integer)', () => {
    expect(parseTestHighScoreFromSearch('?highScore=0')).toBe(0);
  });

  it('returns the default when ?highScore is present without a value', () => {
    expect(parseTestHighScoreFromSearch('?highScore')).toBe(DEFAULT_TEST_HIGH_SCORE);
    expect(parseTestHighScoreFromSearch('?highScore=')).toBe(DEFAULT_TEST_HIGH_SCORE);
  });

  it('returns the default for invalid values (non-numeric, negative)', () => {
    expect(parseTestHighScoreFromSearch('?highScore=abc')).toBe(DEFAULT_TEST_HIGH_SCORE);
    expect(parseTestHighScoreFromSearch('?highScore=-5')).toBe(DEFAULT_TEST_HIGH_SCORE);
  });

  it('parses an integer when given a decimal (parseInt truncation)', () => {
    expect(parseTestHighScoreFromSearch('?highScore=42.9')).toBe(42);
  });

  it('co-exists with other params', () => {
    expect(parseTestHighScoreFromSearch('?mc=3&highScore=77&speed=2')).toBe(77);
  });
});
