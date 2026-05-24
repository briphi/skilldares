import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEndOfGameHighScorePersist } from './useEndOfGameHighScorePersist';
import type { GamePhase } from '../lib/gameReducer';

describe('useEndOfGameHighScorePersist', () => {
  it('writes the score when there is no prior PB (highScore === null)', () => {
    const updateHighScore = vi.fn();
    renderHook(() =>
      useEndOfGameHighScorePersist('end', 42, null, updateHighScore),
    );
    expect(updateHighScore).toHaveBeenCalledOnce();
    expect(updateHighScore).toHaveBeenCalledWith(42);
  });

  it('writes the score when beating the prior PB', () => {
    const updateHighScore = vi.fn();
    renderHook(() =>
      useEndOfGameHighScorePersist('end', 100, 80, updateHighScore),
    );
    expect(updateHighScore).toHaveBeenCalledOnce();
    expect(updateHighScore).toHaveBeenCalledWith(100);
  });

  it('does NOT write when the score equals the prior PB', () => {
    const updateHighScore = vi.fn();
    renderHook(() =>
      useEndOfGameHighScorePersist('end', 80, 80, updateHighScore),
    );
    expect(updateHighScore).not.toHaveBeenCalled();
  });

  it('does NOT write when the score is below the prior PB', () => {
    const updateHighScore = vi.fn();
    renderHook(() =>
      useEndOfGameHighScorePersist('end', 50, 80, updateHighScore),
    );
    expect(updateHighScore).not.toHaveBeenCalled();
  });

  for (const phase of ['start', 'question', 'feedback'] as GamePhase[]) {
    it(`does NOT write when phase is "${phase}" (even with a beating score)`, () => {
      const updateHighScore = vi.fn();
      renderHook(() =>
        useEndOfGameHighScorePersist(phase, 999, 0, updateHighScore),
      );
      expect(updateHighScore).not.toHaveBeenCalled();
    });
  }
});
