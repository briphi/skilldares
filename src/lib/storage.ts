/**
 * Skilldares — localStorage wrapper (FR57 + NFR8).
 *
 * The ONLY file in the codebase that touches `localStorage` directly.
 * All other code (including `useHighScore`) goes through these three functions.
 *
 * Per FR57: if localStorage is unavailable (private browsing, disabled,
 * quota exceeded, etc.), the app continues to function — high-score
 * features silently degrade with no visible error.
 */

const STORAGE_KEY = 'skilldares.highScore';

/**
 * Returns true if localStorage is writable. Uses a probe write+remove
 * because Safari private browsing exposes localStorage but throws on setItem.
 */
export function hasStorage(): boolean {
  try {
    const probeKey = '__skilldares_storage_probe__';
    localStorage.setItem(probeKey, '1');
    localStorage.removeItem(probeKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns the stored high score, or null if unset / unavailable / corrupted.
 */
export function getHighScore(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Writes the high score. Silent no-op if storage is unavailable.
 */
export function setHighScore(score: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(score));
  } catch {
    // Silent per FR57.
  }
}
