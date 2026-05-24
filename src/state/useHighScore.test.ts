import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHighScore } from './useHighScore';

const STORAGE_KEY = 'skilldares.highScore';

describe('useHighScore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with null when no high score is stored', () => {
    const { result } = renderHook(() => useHighScore());
    expect(result.current.highScore).toBeNull();
    expect(result.current.hasStorage).toBe(true);
  });

  it('loads the existing high score from localStorage on mount', () => {
    localStorage.setItem(STORAGE_KEY, '142');
    const { result } = renderHook(() => useHighScore());
    expect(result.current.highScore).toBe(142);
  });

  it('updateHighScore writes to localStorage and updates local state', () => {
    const { result } = renderHook(() => useHighScore());

    act(() => {
      result.current.updateHighScore(100);
    });

    expect(result.current.highScore).toBe(100);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('100');
  });

  it('updateHighScore can be called multiple times', () => {
    const { result } = renderHook(() => useHighScore());

    act(() => {
      result.current.updateHighScore(50);
    });
    expect(result.current.highScore).toBe(50);

    act(() => {
      result.current.updateHighScore(100);
    });
    expect(result.current.highScore).toBe(100);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('100');
  });

  describe('when localStorage is unavailable', () => {
    let original: typeof Storage.prototype.setItem;

    beforeEach(() => {
      original = Storage.prototype.setItem;
      Storage.prototype.setItem = () => {
        throw new Error('storage blocked');
      };
    });

    afterEach(() => {
      Storage.prototype.setItem = original;
    });

    it('reports hasStorage as false', () => {
      const { result } = renderHook(() => useHighScore());
      expect(result.current.hasStorage).toBe(false);
    });

    it('updateHighScore is a silent no-op', () => {
      const { result } = renderHook(() => useHighScore());

      act(() => {
        result.current.updateHighScore(42);
      });

      expect(result.current.highScore).toBeNull();
    });
  });
});
