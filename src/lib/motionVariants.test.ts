import { describe, it, expect } from 'vitest';
import { fadeIn, fadeOut, countUp, shake } from './motionVariants';

describe('motionVariants', () => {
  it('fadeIn has initial + animate keys with 0 → 1 opacity', () => {
    expect(fadeIn.initial).toMatchObject({ opacity: 0 });
    expect(fadeIn.animate).toMatchObject({ opacity: 1 });
  });

  it('fadeOut has exit key dropping opacity to 0', () => {
    expect(fadeOut.exit).toMatchObject({ opacity: 0 });
  });

  it('countUp uses the bounce ease and base duration', () => {
    expect(countUp.duration).toBe(0.25);
    expect(countUp.ease).toEqual([0.34, 1.56, 0.64, 1]);
  });

  it('shake has still + shake states; shake oscillates x', () => {
    expect(shake.still).toMatchObject({ x: 0 });
    const shakeX = (shake.shake as { x: number[] }).x;
    expect(shakeX).toContain(-3);
    expect(shakeX).toContain(3);
  });

  it('shake repeats infinitely (looping animation)', () => {
    const transition = (shake.shake as { transition: { repeat: number } }).transition;
    expect(transition.repeat).toBe(Infinity);
  });
});
