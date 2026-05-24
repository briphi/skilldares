import type { Variants, Transition } from 'motion/react';

/**
 * Skilldares — Motion variants (FR49–FR52).
 *
 * Single source of truth for animation language. Components MUST consume
 * variants from here — never inline duration / easing values across
 * the codebase. The numeric values mirror --motion-base (250ms) and the
 * eases declared in src/styles/global.css; we duplicate the resolved
 * numbers here because Motion needs JS values, not CSS vars.
 */

const BASE_DURATION = 0.25;
const EASE_SNAPPY: [number, number, number, number] = [0.4, 0, 0.2, 1];
const EASE_BOUNCE: [number, number, number, number] = [0.34, 1.56, 0.64, 1];

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: BASE_DURATION, ease: EASE_SNAPPY } },
};

export const fadeOut: Variants = {
  exit: { opacity: 0, transition: { duration: BASE_DURATION, ease: EASE_SNAPPY } },
};

export const countUp: Transition = {
  duration: BASE_DURATION,
  ease: EASE_BOUNCE,
};

/**
 * Low-time shake (FR15 / TimerDisplay).
 *
 * Two states: `still` (no motion) and `shake` (small horizontal oscillation).
 * Consumers SHOULD branch on `useReducedMotion()` and pass 'still' instead of
 * 'shake' when the user prefers reduced motion (the color shift remains as
 * the urgency signal in that case).
 */
export const shake: Variants = {
  still: { x: 0 },
  shake: {
    x: [0, -3, 3, -3, 3, 0],
    transition: { duration: 0.35, repeat: Infinity, ease: 'linear' },
  },
};
