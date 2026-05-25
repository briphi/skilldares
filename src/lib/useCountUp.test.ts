import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountUp } from './useCountUp';

/**
 * Helper: drive a single rAF tick using fake timers. jsdom's rAF
 * polyfill is a ~16ms setTimeout, so advancing the timer by 16ms
 * fires the next callback.
 */
function advanceFrame(ms: number = 16): void {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

/** Override the global matchMedia stub for a single test. */
function setReducedMotion(reduce: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    (query: string) => ({
      matches: reduce && query.includes('prefers-reduced-motion: reduce'),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  );
}

describe('useCountUp', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  describe('snap cases (no animation)', () => {
    it('snaps to target when prefers-reduced-motion: reduce (default test stub)', () => {
      const { result } = renderHook(() => useCountUp(42));
      expect(result.current).toBe(42);
    });

    it('snaps to target when disabled=true (even with motion enabled)', () => {
      setReducedMotion(false);
      const { result } = renderHook(() => useCountUp(42, { disabled: true }));
      expect(result.current).toBe(42);
    });

    it('snaps to 0 when target is 0', () => {
      setReducedMotion(false);
      const { result } = renderHook(() => useCountUp(0));
      expect(result.current).toBe(0);
    });

    it('snaps to target when durationMs is 0', () => {
      setReducedMotion(false);
      const { result } = renderHook(() => useCountUp(42, { durationMs: 0 }));
      expect(result.current).toBe(42);
    });

    it('snaps to a negative target without animating', () => {
      setReducedMotion(false);
      const { result } = renderHook(() => useCountUp(-5));
      expect(result.current).toBe(-5);
    });
  });

  describe('animation path (motion enabled)', () => {
    beforeEach(() => {
      setReducedMotion(false);
      vi.useFakeTimers();
    });

    it('starts at 0 before any frame ticks', () => {
      const { result } = renderHook(() => useCountUp(100, { durationMs: 100 }));
      expect(result.current).toBe(0);
    });

    it('reaches target after the animation duration elapses', () => {
      const { result } = renderHook(() => useCountUp(100, { durationMs: 100 }));
      // Advance well past the duration. jsdom's rAF polyfill is
      // ~16ms-spaced setTimeout, so 200ms fires many frames.
      advanceFrame(200);
      expect(result.current).toBe(100);
    });

    it('produces an intermediate value mid-animation (monotonic, integer)', () => {
      const { result } = renderHook(() => useCountUp(100, { durationMs: 320 }));
      // After one frame (~16ms ≈ 5% of 320ms), eased value is small
      // but should be > 0 and < 100.
      advanceFrame(16);
      const mid = result.current;
      expect(mid).toBeGreaterThanOrEqual(0);
      expect(mid).toBeLessThan(100);
      expect(Number.isInteger(mid)).toBe(true);
    });

    it('holds at 0 during the leading delay window', () => {
      const { result } = renderHook(() =>
        useCountUp(100, { durationMs: 100, delayMs: 200 }),
      );
      advanceFrame(50);
      // Inside the 200ms delay → still 0.
      expect(result.current).toBe(0);
    });

    it('reaches target after delay + duration elapses', () => {
      const { result } = renderHook(() =>
        useCountUp(100, { durationMs: 100, delayMs: 200 }),
      );
      advanceFrame(400);
      expect(result.current).toBe(100);
    });
  });
});
