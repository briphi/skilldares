import { useEffect, useState } from 'react';

export type UseCountUpOptions = {
  /** Animation duration in milliseconds. Default 900. */
  durationMs?: number;
  /** Delay before the count-up begins, in ms. Used to stagger
      multiple rows. Default 0. */
  delayMs?: number;
  /** Skip the animation entirely and snap to `target`. */
  disabled?: boolean;
};

/**
 * Animate an integer from 0 up to `target` over `durationMs` via
 * requestAnimationFrame, easing out with cubic so it slows into the
 * final value. Returns the current displayed value (always integer).
 *
 * Snaps to `target` immediately when any of:
 *   - `disabled` is true
 *   - the user prefers reduced motion
 *   - `target` is 0 or negative (nothing to count)
 *   - `durationMs` is 0 or negative
 *
 * Used by EndScreen's Scorecard to roll the headline numbers up on
 * reveal — a small thing but reads as "your stats are being tallied"
 * instead of just appearing.
 */
export function useCountUp(target: number, options: UseCountUpOptions = {}): number {
  const { durationMs = 900, delayMs = 0, disabled = false } = options;
  const [value, setValue] = useState(0);

  useEffect(() => {
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

    if (disabled || reduceMotion || target <= 0 || durationMs <= 0) {
      setValue(target);
      return;
    }

    setValue(0);
    let rafId: number | null = null;
    let startTimestamp: number | null = null;

    const tick = (timestamp: number) => {
      if (startTimestamp === null) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp - delayMs;

      if (elapsed < 0) {
        // Still inside the leading delay window — hold at 0 and keep
        // requesting frames so we resume cleanly when delay elapses.
        rafId = window.requestAnimationFrame(tick);
        return;
      }

      const progress = Math.min(1, elapsed / durationMs);
      // easeOutCubic — fast start, gentle settle. Reads as a tally
      // racing up and braking into place.
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));

      if (progress < 1) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, [target, durationMs, delayMs, disabled]);

  return value;
}
