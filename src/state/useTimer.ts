import { useEffect, useRef, useState } from 'react';

export type UseTimerOptions = {
  /** Countdown duration in seconds. Default 15 (per FR15). */
  durationSeconds?: number;
  /** Called exactly once when the timer reaches 0. */
  onExpire?: () => void;
  /** When true, the countdown halts. Resumes when set back to false. */
  paused?: boolean;
};

export type UseTimerResult = {
  secondsRemaining: number;
};

/**
 * Skilldares — Countdown timer hook (FR15, FR17, FR23, FR33).
 *
 * Counts down in 1-second integer ticks. Calls onExpire exactly once
 * when reaching 0; safe to leave mounted after expiry (won't fire again).
 * Decoupled from the reducer — parent wires onExpire to dispatch (typically
 * `helpers.answerQuestion(false)` per FR33).
 */
export function useTimer({
  durationSeconds = 15,
  onExpire,
  paused = false,
}: UseTimerOptions = {}): UseTimerResult {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(durationSeconds);
  const expiredRef = useRef<boolean>(false);
  const onExpireRef = useRef(onExpire);

  // Keep onExpire ref fresh without restarting the interval each render.
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (paused) return;

    const id = setInterval(() => {
      setSecondsRemaining((prev) => {
        const next = Math.max(0, prev - 1);
        if (next === 0 && !expiredRef.current) {
          expiredRef.current = true;
          onExpireRef.current?.();
          clearInterval(id);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [paused]);

  return { secondsRemaining };
}
