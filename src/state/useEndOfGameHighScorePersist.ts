import { useEffect, useRef, useState } from 'react';
import type { GamePhase } from '../lib/gameReducer';

export type UseEndOfGameHighScorePersistResult = {
  /**
   * The PB value at the moment the player reached end phase, BEFORE this
   * game's score was written. Null if there was no prior PB (first game)
   * OR if storage was unavailable. Resets to null when phase leaves 'end'.
   *
   * Used by EndScreen to drive the celebrating-variant branch and the
   * "Was: {previousHighScore}" line.
   */
  previousHighScore: number | null;
};

/**
 * Skilldares — PB persistence hook (extended in Story 3.3).
 *
 * Watches game phase; when the player reaches end-phase with a score that
 * beats their stored personal best (or there's no PB yet), writes the new
 * score via the provided updater.
 *
 * Also snapshots the pre-update highScore on entry to end-phase, so
 * EndScreen can decide whether to render the celebrating variant. The
 * snapshot is captured exactly once per end-phase entry (via capturedRef
 * guard) to avoid being overwritten when updateHighScore triggers a
 * re-render.
 *
 * Lives outside EndScreen to dodge useHighScore's load-on-mount race —
 * AppShell holds useHighScore for the entire session, so highScore is stable
 * by the time end-phase is reached.
 */
export function useEndOfGameHighScorePersist(
  phase: GamePhase,
  score: number,
  highScore: number | null,
  updateHighScore: (score: number) => void,
): UseEndOfGameHighScorePersistResult {
  const [previousHighScore, setPreviousHighScore] = useState<number | null>(null);
  const capturedRef = useRef<boolean>(false);

  useEffect(() => {
    if (phase !== 'end') {
      // Reset on transition away from end so the next game's End screen
      // gets a fresh capture.
      setPreviousHighScore(null);
      capturedRef.current = false;
      return;
    }
    if (capturedRef.current) return; // already captured for this end-phase entry
    setPreviousHighScore(highScore);
    capturedRef.current = true;
    if (highScore === null || score > highScore) {
      updateHighScore(score);
    }
  }, [phase, score, highScore, updateHighScore]);

  return { previousHighScore };
}
