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
const LAST_MESSAGES_KEY = 'skilldares.lastShownMessages';

/**
 * Map of message-pool id → the last message text shown from that pool.
 * Used to avoid showing the same feedback message twice in a row (even
 * across game sessions / refreshes — that's why this lives in storage,
 * not in component state).
 *
 * Storage uses `string` keys/values to keep storage.ts dependency-free;
 * callers are MessagePoolId-aware.
 */
export type LastShownMessageMap = Record<string, string>;

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

/**
 * Returns the persisted "last shown message per pool" map.
 * Empty object on first run / unavailable storage / corrupted data.
 */
export function getLastShownMessages(): LastShownMessageMap {
  try {
    const raw = localStorage.getItem(LAST_MESSAGES_KEY);
    if (raw === null) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    // Defensively filter to string-keyed string values only.
    const out: LastShownMessageMap = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'string') out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Updates the last-shown message for a single pool. Silent no-op if
 * storage is unavailable (FR57).
 */
export function setLastShownMessage(pool: string, message: string): void {
  try {
    const current = getLastShownMessages();
    current[pool] = message;
    localStorage.setItem(LAST_MESSAGES_KEY, JSON.stringify(current));
  } catch {
    // Silent per FR57.
  }
}
