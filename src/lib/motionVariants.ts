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

/**
 * Confetti particle (Story 3.2 / EndScreen celebrating variant).
 *
 * Each particle takes a `custom={{ angle, distance }}` prop for per-particle
 * direction. Multiple particles compose the burst — see <Confetti /> in
 * src/components/shared/Confetti.tsx for the layer that generates them.
 *
 * Animation: pop (scale 0→1), travel along the angle with gravity pull,
 * rotate, fade out. Total duration ~2.5s.
 */
export const confettiParticle: Variants = {
  initial: { x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 },
  burst: (custom: { angle: number; distance: number }) => ({
    x: Math.cos((custom.angle * Math.PI) / 180) * custom.distance,
    y: Math.sin((custom.angle * Math.PI) / 180) * custom.distance + 200,
    scale: [0, 1, 1, 0],
    opacity: [1, 1, 1, 0],
    rotate: 360,
    transition: { duration: 2.5, ease: 'easeOut' },
  }),
};

/**
 * Color palette for confetti particles — the 4 MC answer colors + the 2 brand colors.
 * Centralized here so the celebration palette stays in sync with the visual design system.
 */
export const CONFETTI_COLORS = [
  'var(--color-answer-1)',
  'var(--color-answer-2)',
  'var(--color-answer-3)',
  'var(--color-answer-4)',
  'var(--color-brand-primary)',
  'var(--color-brand-accent)',
] as const;
