import { useCallback, useEffect, useState } from 'react';
import { getHighScore, hasStorage, setHighScore } from '../lib/storage';

/**
 * Skilldares — useHighScore hook.
 *
 * Exposes the personal-best high score (per FR47, FR8) as React state, with
 * a writer that persists through `storage.setHighScore` and updates local
 * state so consumers re-render. Consumers MUST NOT touch `localStorage`
 * directly — go through this hook (which goes through `src/lib/storage.ts`).
 *
 * When storage is unavailable (FR57), `hasStorage` is `false`, `highScore`
 * stays `null`, and `updateHighScore` becomes a silent no-op. UI can use
 * `hasStorage` to conditionally hide high-score-related elements.
 */

export interface UseHighScoreResult {
  highScore: number | null;
  updateHighScore: (score: number) => void;
  hasStorage: boolean;
}

export function useHighScore(): UseHighScoreResult {
  const [storageAvailable] = useState<boolean>(() => hasStorage());
  const [highScore, setHighScoreState] = useState<number | null>(null);

  useEffect(() => {
    if (storageAvailable) {
      setHighScoreState(getHighScore());
    }
  }, [storageAvailable]);

  const updateHighScore = useCallback(
    (score: number) => {
      if (!storageAvailable) return;
      setHighScore(score);
      setHighScoreState(score);
    },
    [storageAvailable],
  );

  return {
    highScore,
    updateHighScore,
    hasStorage: storageAvailable,
  };
}
