import { describe, it, expect } from 'vitest';
import {
  parseGameConfigFromSearch,
  DEFAULT_MC_COUNT,
  DEFAULT_SPEED_COUNT,
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
