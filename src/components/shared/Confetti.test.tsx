import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

// Hoisted mock for useReducedMotion — we toggle the return between tests.
const useReducedMotionMock = vi.hoisted(() => vi.fn<() => boolean | null>());

vi.mock('motion/react', async () => {
  const actual = await vi.importActual<typeof import('motion/react')>('motion/react');
  return {
    ...actual,
    useReducedMotion: useReducedMotionMock,
  };
});

// Import AFTER the mock declaration so Confetti's `useReducedMotion` is the mock.
import { Confetti } from './Confetti';

describe('Confetti', () => {
  describe('full-motion (default)', () => {
    beforeEach(() => {
      useReducedMotionMock.mockReturnValue(false);
    });

    it('renders without crashing', () => {
      expect(() => render(<Confetti />)).not.toThrow();
    });

    it('renders the particle container with multiple particles', () => {
      const { container } = render(<Confetti />);
      const root = container.querySelector('[data-confetti-mode="full"]');
      expect(root).toBeTruthy();
      expect(root!.children.length).toBeGreaterThan(10);
    });

    it('overlay is aria-hidden (decorative)', () => {
      const { container } = render(<Confetti />);
      const root = container.querySelector('[data-confetti-mode="full"]') as HTMLElement;
      expect(root.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('reduced-motion fallback', () => {
    beforeEach(() => {
      useReducedMotionMock.mockReturnValue(true);
    });

    it('renders the reduced-motion fallback (no particle container)', () => {
      const { container } = render(<Confetti />);
      const reducedRoot = container.querySelector('[data-confetti-mode="reduced"]');
      expect(reducedRoot).toBeTruthy();
      const fullRoot = container.querySelector('[data-confetti-mode="full"]');
      expect(fullRoot).toBeNull();
    });
  });
});

