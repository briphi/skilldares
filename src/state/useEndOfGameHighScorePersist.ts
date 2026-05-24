import { useEffect } from 'react';
import type { GamePhase } from '../lib/gameReducer';

/**
 * Skilldares — PB persistence hook.
 *
 * Watches game phase; when the player reaches end-phase with a score that
 * beats their stored personal best (or there's no PB yet), writes the new
 * score via the provided updater.
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
): void {
  useEffect(() => {
    if (phase !== 'end') return;
    if (highScore === null || score > highScore) {
      updateHighScore(score);
    }
  }, [phase, score, highScore, updateHighScore]);
}
