import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimer } from './useTimer';

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts at the default duration (15s)', () => {
    const { result } = renderHook(() => useTimer());
    expect(result.current.secondsRemaining).toBe(15);
  });

  it('starts at the custom duration when provided', () => {
    const { result } = renderHook(() => useTimer({ durationSeconds: 30 }));
    expect(result.current.secondsRemaining).toBe(30);
  });

  it('decrements by 1 every second', () => {
    const { result } = renderHook(() => useTimer({ durationSeconds: 5 }));
    expect(result.current.secondsRemaining).toBe(5);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.secondsRemaining).toBe(4);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.secondsRemaining).toBe(3);
  });

  it('reaches 0 after exactly durationSeconds elapse', () => {
    const { result } = renderHook(() => useTimer({ durationSeconds: 3 }));
    act(() => { vi.advanceTimersByTime(3000); });
    expect(result.current.secondsRemaining).toBe(0);
  });

  it('calls onExpire exactly once when reaching 0', () => {
    const onExpire = vi.fn();
    renderHook(() => useTimer({ durationSeconds: 2, onExpire }));
    act(() => { vi.advanceTimersByTime(2000); });
    expect(onExpire).toHaveBeenCalledOnce();

    // Even if more time passes, onExpire shouldn't fire again.
    act(() => { vi.advanceTimersByTime(5000); });
    expect(onExpire).toHaveBeenCalledOnce();
  });

  it('does NOT decrement when paused', () => {
    const { result } = renderHook(() => useTimer({ durationSeconds: 5, paused: true }));
    act(() => { vi.advanceTimersByTime(3000); });
    expect(result.current.secondsRemaining).toBe(5);
  });

  it('cleanup on unmount stops the interval (no further onExpire)', () => {
    const onExpire = vi.fn();
    const { unmount } = renderHook(() => useTimer({ durationSeconds: 5, onExpire }));
    unmount();
    act(() => { vi.advanceTimersByTime(10000); });
    expect(onExpire).not.toHaveBeenCalled();
  });
});
