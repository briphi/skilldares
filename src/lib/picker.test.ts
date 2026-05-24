import { describe, it, expect } from 'vitest';
import { pickPool, pickMessage } from './picker';

describe('pickPool', () => {
  describe('on correct answer', () => {
    it('returns right-no-streak when prev=0', () => {
      expect(pickPool(0, true)).toBe('right-no-streak');
    });

    it('returns right-no-streak when prev=+1 (new streak +2 is below threshold)', () => {
      expect(pickPool(1, true)).toBe('right-no-streak');
    });

    it('returns on-fire when prev=+2 (new streak +3 hits threshold)', () => {
      expect(pickPool(2, true)).toBe('on-fire');
    });

    it('returns on-fire when prev=+3 (continues on-fire)', () => {
      expect(pickPool(3, true)).toBe('on-fire');
    });

    it('returns on-fire when prev=+5 (continues on-fire)', () => {
      expect(pickPool(5, true)).toBe('on-fire');
    });

    it('returns comeback when prev=-3 (ending 3+ wrong streak)', () => {
      expect(pickPool(-3, true)).toBe('comeback');
    });

    it('returns comeback when prev=-5 (ending 5-wrong streak)', () => {
      expect(pickPool(-5, true)).toBe('comeback');
    });

    it('returns right-no-streak when prev=-1 (no streak yet to end)', () => {
      expect(pickPool(-1, true)).toBe('right-no-streak');
    });

    it('returns right-no-streak when prev=-2 (no streak yet to end)', () => {
      expect(pickPool(-2, true)).toBe('right-no-streak');
    });
  });

  describe('on wrong answer', () => {
    it('returns wrong-no-streak when prev=0', () => {
      expect(pickPool(0, false)).toBe('wrong-no-streak');
    });

    it('returns wrong-no-streak when prev=-1 (new streak -2 is below threshold)', () => {
      expect(pickPool(-1, false)).toBe('wrong-no-streak');
    });

    it('returns doing-bad when prev=-2 (new streak -3 hits threshold)', () => {
      expect(pickPool(-2, false)).toBe('doing-bad');
    });

    it('returns doing-bad when prev=-3 (continues doing-bad)', () => {
      expect(pickPool(-3, false)).toBe('doing-bad');
    });

    it('returns doing-bad when prev=-5 (continues doing-bad)', () => {
      expect(pickPool(-5, false)).toBe('doing-bad');
    });

    it('returns streak-broken when prev=+3 (ending 3-correct streak)', () => {
      expect(pickPool(3, false)).toBe('streak-broken');
    });

    it('returns streak-broken when prev=+5 (ending 5-correct streak)', () => {
      expect(pickPool(5, false)).toBe('streak-broken');
    });

    it('returns wrong-no-streak when prev=+1 (no streak yet to break)', () => {
      expect(pickPool(1, false)).toBe('wrong-no-streak');
    });

    it('returns wrong-no-streak when prev=+2 (no streak yet to break)', () => {
      expect(pickPool(2, false)).toBe('wrong-no-streak');
    });
  });
});

describe('pickMessage', () => {
  const pool = ['first', 'second', 'third', 'fourth', 'fifth'];

  it('returns the first message when rng returns 0', () => {
    expect(pickMessage(pool, () => 0)).toBe('first');
  });

  it('returns the middle message when rng returns 0.5 (5 items, floor(2.5)=2)', () => {
    expect(pickMessage(pool, () => 0.5)).toBe('third');
  });

  it('returns the last message when rng returns 0.99 (just under 1)', () => {
    expect(pickMessage(pool, () => 0.99)).toBe('fifth');
  });

  it('handles a pool with a single message regardless of rng value', () => {
    expect(pickMessage(['only'], () => 0)).toBe('only');
    expect(pickMessage(['only'], () => 0.5)).toBe('only');
    expect(pickMessage(['only'], () => 0.99)).toBe('only');
  });

  it('throws when the pool is empty', () => {
    expect(() => pickMessage([], () => 0)).toThrow(/pool is empty/);
  });

  describe('excludeMessage (avoid back-to-back repeats)', () => {
    it('excludes the named message from the candidate set', () => {
      // rng=0 would normally pick "first"; with "first" excluded, the
      // candidates become ["second", "third", "fourth", "fifth"] and rng=0
      // picks the first of those.
      expect(pickMessage(pool, () => 0, 'first')).toBe('second');
    });

    it('returns the only-other message when one is excluded from a 2-item pool', () => {
      expect(pickMessage(['a', 'b'], () => 0, 'a')).toBe('b');
      expect(pickMessage(['a', 'b'], () => 0, 'b')).toBe('a');
    });

    it('falls back to the full pool when excluding would leave 0 candidates (single-item pool)', () => {
      expect(pickMessage(['only'], () => 0, 'only')).toBe('only');
    });

    it('falls back to the full pool when excludeMessage is not in the pool', () => {
      // "nope" isn't in the pool — exclusion is a no-op
      expect(pickMessage(pool, () => 0, 'nope')).toBe('first');
    });

    it('ignores null exclude (same as omitted)', () => {
      expect(pickMessage(pool, () => 0, null)).toBe('first');
    });

    it('excludes ALL copies if a pool somehow contains duplicates', () => {
      const dupePool = ['a', 'b', 'a', 'c'];
      // 'a' appears twice; both should be filtered. Candidates: ['b', 'c'].
      expect(pickMessage(dupePool, () => 0, 'a')).toBe('b');
      expect(pickMessage(dupePool, () => 0.99, 'a')).toBe('c');
    });
  });
});
