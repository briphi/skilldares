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

  describe('previousHighScore snapshot (Story 3.3)', () => {
    it('captures null when there is no prior PB (first game)', () => {
      const updateHighScore = vi.fn();
      const { result } = renderHook(() =>
        useEndOfGameHighScorePersist('end', 42, null, updateHighScore),
      );
      expect(result.current.previousHighScore).toBeNull();
    });

    it('captures the prior PB value when player beats it', () => {
      const updateHighScore = vi.fn();
      const { result } = renderHook(() =>
        useEndOfGameHighScorePersist('end', 100, 80, updateHighScore),
      );
      expect(result.current.previousHighScore).toBe(80);
    });

    it('captures the prior PB even when player did NOT beat it', () => {
      const updateHighScore = vi.fn();
      const { result } = renderHook(() =>
        useEndOfGameHighScorePersist('end', 50, 80, updateHighScore),
      );
      expect(result.current.previousHighScore).toBe(80);
    });

    it('snapshot is null when phase is not end', () => {
      const updateHighScore = vi.fn();
      const { result } = renderHook(() =>
        useEndOfGameHighScorePersist('question', 50, 80, updateHighScore),
      );
      expect(result.current.previousHighScore).toBeNull();
    });

    it('resets snapshot to null when phase leaves end', () => {
      const updateHighScore = vi.fn();
      const { result, rerender } = renderHook(
        ({ phase }: { phase: GamePhase }) =>
          useEndOfGameHighScorePersist(phase, 100, 80, updateHighScore),
        { initialProps: { phase: 'end' as GamePhase } },
      );
      expect(result.current.previousHighScore).toBe(80);

      rerender({ phase: 'start' });
      expect(result.current.previousHighScore).toBeNull();
    });

    it('snapshot is NOT overwritten when highScore updates within the same end-phase entry', () => {
      const updateHighScore = vi.fn();
      const { result, rerender } = renderHook(
        ({ highScore }: { highScore: number | null }) =>
          useEndOfGameHighScorePersist('end', 100, highScore, updateHighScore),
        { initialProps: { highScore: 80 as number | null } },
      );
      expect(result.current.previousHighScore).toBe(80);

      // Simulate updateHighScore having written the new score → highScore now 100
      rerender({ highScore: 100 });
      // Snapshot should still be 80 (captured on first end-phase entry).
      expect(result.current.previousHighScore).toBe(80);
    });
  });
});
