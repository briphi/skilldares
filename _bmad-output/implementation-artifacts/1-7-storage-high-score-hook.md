# Story 1.7: localStorage Wrapper + useHighScore Hook

Status: review

## Story

As a developer,
I want a guarded `localStorage` wrapper plus a `useHighScore` React hook (the project's first React-side state hook),
so that the high-score feature persists per-device AND silently degrades when localStorage is unavailable (FR57), without leaking the storage API to any other code.

## ⚠️ Deviation from Architecture Roadmap

The architecture's implementation roadmap (and Story 1.6's plan) had jsdom + `@testing-library/react` landing in **Story 1.9** (shared primitives). This story pulls that work forward by **2 stories** because `useHighScore` is a React hook that needs `renderHook` for proper testing, and `storage.ts` needs a localStorage stub for `hasStorage()` testing.

Pulling these deps in now keeps every code module testable from the moment it ships (NFR9). The cost is a heavier-than-usual `npm install` step in Story 1.7; the benefit is no untested code accumulates.

## Acceptance Criteria

1. **Test infrastructure for DOM-environment code installed:**
   - `jsdom` added to `devDependencies` (latest stable)
   - `@testing-library/react@^16.3.2` added to `devDependencies` (peer dep declares React 18 but works fine with React 19 — may require `--legacy-peer-deps`; documented in Dev Notes)
   - `@testing-library/user-event` added to `devDependencies` (won't be exercised until Story 1.10+ component tests, but install now alongside its companion)
   - `vite.config.ts` `test.environment` changed from `'node'` to `'jsdom'`
   - All 51 existing tests from Story 1.6 still pass under jsdom (no regressions)

2. **`src/lib/storage.ts` implemented per FR57 + NFR8:**
   - Exports `hasStorage(): boolean`, `getHighScore(): number | null`, `setHighScore(score: number): void`
   - ONLY file in the codebase that touches `localStorage` directly (architectural boundary)
   - All three functions wrap their `localStorage` calls in try/catch
   - `hasStorage()` actually attempts a write+read+remove probe (catches Safari private-browsing where `localStorage` exists as an object but throws on `setItem`)
   - `getHighScore()` returns `null` for missing keys AND for corrupted non-numeric values
   - `setHighScore()` is a silent no-op when storage is unavailable
   - Uses storage key `'skilldares.highScore'` (namespaced to avoid collision)

3. **`src/state/useHighScore.ts` implemented:**
   - First file in the new `src/state/` directory (architecture's chosen location for React Context + hooks)
   - Exports a custom hook `useHighScore()` returning `{ highScore: number | null, updateHighScore: (score: number) => void, hasStorage: boolean }`
   - Reads stored value on mount (only when storage is available)
   - `updateHighScore(score)` writes through `storage.setHighScore` AND updates local state so consumers re-render
   - Consumers NEVER touch `localStorage` directly — only this hook (which only touches `src/lib/storage.ts`)

4. **Co-located tests for both modules:**
   - `src/lib/storage.test.ts` — covers hasStorage true/false, getHighScore (unset/valid/corrupted), setHighScore (writes/silent-no-op)
   - `src/state/useHighScore.test.ts` — uses `renderHook` from `@testing-library/react`; covers initial-null, load-existing, update flow, storage-unavailable degradation
   - All tests pass — `npm test` shows green

5. **Build + deploy unaffected:**
   - `npm run build` clean (prebuild + tsc + vite)
   - `npm test` exit 0
   - AWS Amplify build clean
   - Live site at `https://www.skilldares.com/` byte-identical (hook not yet consumed by any component — Story 1.16 wires it into EndScreen)

## Tasks / Subtasks

- [x] **Task 1: Pre-work safety check** (AC: #5)
  - [x] Working tree clean (only untracked: `notes`)
  - [x] On `main`, up to date with `origin/main`
  - [x] Verify Story 1.6 in place: `src/lib/` has rng/scoring/streak/picker/questionSelection + tests; `npm test` shows 51 passing
  - [x] Create feature branch `story/1-7-storage-high-score`

- [x] **Task 2: Install jsdom + @testing-library/react + @testing-library/user-event** (AC: #1)
  - [x] Try first: `npm install --save-dev jsdom @testing-library/react @testing-library/user-event`
  - [x] If npm errors with `ERESOLVE` about React 18 peer dep: re-run with `--legacy-peer-deps` flag
  - [x] Verify install: `npm ls jsdom @testing-library/react @testing-library/user-event` shows all three

- [x] **Task 3: Switch test environment to jsdom** (AC: #1)
  - [x] Edit `vite.config.ts`: change `environment: 'node'` to `environment: 'jsdom'`
  - [x] Run `npm test` — verify all 51 existing tests still pass under jsdom (no regressions)
  - [x] If any pre-existing test fails under jsdom, fix it before moving on

- [x] **Task 4: Implement `src/lib/storage.ts`** (AC: #2)
  - [x] Create file with exact content in Dev Notes below
  - [x] Run `npx tsc --noEmit` — must pass under strict mode

- [x] **Task 5: Write `src/lib/storage.test.ts`** (AC: #2, #4)
  - [x] Create test file with exact content in Dev Notes (covers all three functions across both happy and storage-throws paths)
  - [x] Run `npx vitest run src/lib/storage.test.ts` — must pass
  - [x] Verify tests properly restore `Storage.prototype.setItem` after stubbing

- [x] **Task 6: Implement `src/state/useHighScore.ts`** (AC: #3)
  - [x] Create directory `src/state/` (new — first file lives here)
  - [x] Create `useHighScore.ts` with exact content in Dev Notes below
  - [x] Run `npx tsc --noEmit` — must pass

- [x] **Task 7: Write `src/state/useHighScore.test.ts`** (AC: #3, #4)
  - [x] Create test file with exact content in Dev Notes (uses `renderHook` + `act` from `@testing-library/react`)
  - [x] Run `npx vitest run src/state/useHighScore.test.ts` — must pass

- [x] **Task 8: Run full test suite** (AC: #4, #5)
  - [x] `npm test` — all tests pass (51 from Story 1.6 + new ones from this story)
  - [x] Note total count in Dev Agent Record

- [x] **Task 9: Build pipeline verification** (AC: #5)
  - [x] `npm run build` — prebuild + tsc + vite clean
  - [x] Bundle size unchanged

- [x] **Task 10: Commit + push** (AC: #5)
  - [x] Stage: `git add src/ vite.config.ts package.json package-lock.json`
  - [x] Commit message names storage + useHighScore + early-install-of-jsdom/RTL
  - [x] Fast-forward `main`, push to `origin`, delete feature branch

- [x] **Task 11: Verify production deploy** (AC: #5)
  - [x] Wait for Amplify build
  - [x] Live site unchanged

## Dev Notes

### Project Background

Two small but important modules:

1. **`src/lib/storage.ts`** — the *only* place in the codebase that touches `localStorage`. Per architecture's "Cross-Cutting → localStorage wrapper (FR57)": all storage access goes through this module, with try/catch around every call so private-browsing / disabled-storage degrades silently.

2. **`src/state/useHighScore.ts`** — the project's **first React hook**. Consumers (Stories 1.16 EndScreen, 1.10 StartScreen if it shows last-best, etc.) get `{ highScore, updateHighScore, hasStorage }` and never touch storage directly. This establishes the hook-as-API pattern that `useGameState` (Story 1.8) and `useTimer` (Story 2.5) will follow.

### Why We're Installing jsdom + RTL One Story Early

The architecture's roadmap had jsdom + RTL land in Story 1.9. But `storage.test.ts` needs jsdom for `localStorage` testing, and `useHighScore.test.ts` needs `renderHook` for proper hook testing. Pulling these deps in now keeps every shipped module under NFR9 test coverage.

### React 19 + RTL Peer Dep Note

`@testing-library/react@16.3.2` declares a peer dep on `react@"^18.0.0"`. We have React 19. npm 7+ enforces peer deps and may throw `ERESOLVE`:

- **Try first:** `npm install --save-dev jsdom @testing-library/react @testing-library/user-event`
- **If it fails:** Re-run with `--legacy-peer-deps`

Runtime compat is fine — RTL 16 works with React 19 in practice; peer-dep declaration is just stale.

### Exact Content for `src/lib/storage.ts`

```typescript
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
```

### Exact Content for `src/lib/storage.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { hasStorage, getHighScore, setHighScore } from './storage';

const STORAGE_KEY = 'skilldares.highScore';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('hasStorage', () => {
    it('returns true when localStorage works', () => {
      expect(hasStorage()).toBe(true);
    });

    it('does not leave the probe key behind', () => {
      hasStorage();
      expect(localStorage.getItem('__skilldares_storage_probe__')).toBeNull();
    });

    describe('when localStorage.setItem throws', () => {
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

      it('returns false', () => {
        expect(hasStorage()).toBe(false);
      });
    });
  });

  describe('getHighScore', () => {
    it('returns null when no value is stored', () => {
      expect(getHighScore()).toBeNull();
    });

    it('returns the stored integer', () => {
      localStorage.setItem(STORAGE_KEY, '142');
      expect(getHighScore()).toBe(142);
    });

    it('returns the stored zero (not falsy-null)', () => {
      localStorage.setItem(STORAGE_KEY, '0');
      expect(getHighScore()).toBe(0);
    });

    it('returns null for a non-numeric stored value (corrupted state)', () => {
      localStorage.setItem(STORAGE_KEY, 'not-a-number');
      expect(getHighScore()).toBeNull();
    });
  });

  describe('setHighScore', () => {
    it('writes the score to localStorage', () => {
      setHighScore(99);
      expect(localStorage.getItem(STORAGE_KEY)).toBe('99');
    });

    it('overwrites a previous value', () => {
      setHighScore(50);
      setHighScore(100);
      expect(localStorage.getItem(STORAGE_KEY)).toBe('100');
    });

    describe('when localStorage.setItem throws', () => {
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

      it('does not throw (silent no-op)', () => {
        expect(() => setHighScore(42)).not.toThrow();
      });
    });
  });
});
```

### Exact Content for `src/state/useHighScore.ts`

```typescript
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
```

### Exact Content for `src/state/useHighScore.test.ts`

```typescript
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
```

### Pattern Established for Future Hooks

This hook sets the shape that `useGameState` (Story 1.8) and `useTimer` (Story 2.5) will follow:

1. **Hook returns a typed object** (not a tuple) — clearer at call sites
2. **`useCallback` for stable function identity** — prevents downstream re-renders
3. **`useState` initializer function** for one-time setup that runs on mount only
4. **Side effects in `useEffect`** with explicit dependency array
5. **Boundary preserved** — the hook never leaks the underlying API to consumers

### Common LLM Mistakes to Avoid

- **Do NOT** import `localStorage` directly from any file other than `src/lib/storage.ts`
- **Do NOT** use `JSON.parse` for the high score — it's a single integer; `Number.parseInt` is correct and simpler
- **Do NOT** add a `clearHighScore` function — out of scope for v1
- **Do NOT** install `happy-dom` or `@vitest/web-worker` — jsdom is the chosen DOM environment
- **Do NOT** use `@testing-library/jest-dom` — RTL's `renderHook` + Vitest matchers are enough for this story
- **Do NOT** use globals — explicit imports per Story 1.6 vite.config.ts decision
- **Do NOT** put `useHighScore.ts` in `src/lib/` — it lives in `src/state/` per architecture file tree

### Testing Standards

- Vitest + jsdom for both storage and useHighScore tests
- `renderHook` from `@testing-library/react` for hooks
- `act` wrapping for state updates
- `beforeEach(() => localStorage.clear())` isolates tests
- Stub `Storage.prototype.setItem` (cleaner than per-instance stubbing; works across all Storage instances)
- Always restore prototype in `afterEach` to avoid test leakage

### Previous Story Intelligence

**From Story 1.6:**
- Vitest 4.1.7 installed; `npm test` runs all `*.test.ts(x)` files
- `vite.config.ts` uses `import { defineConfig } from 'vitest/config'`
- Pattern: import `{ describe, it, expect, ... }` from `'vitest'` explicitly
- All pure-logic modules use `Rng` injection for determinism; this story's storage layer doesn't need it but follows the same boundary-pure principle

### Git Intelligence

Last 4 commits on main:

```
68d7de3 Add Story 1.6 dev spec to planning artifacts
50bd770 Story 1.6: pure logic modules (scoring, streak, picker, questionSelection) + Vitest
dadb4ae Add Story 1.5 dev spec to planning artifacts
6a95667 Story 1.5: author 350 personality messages (7 pools × 50)
```

Story 1.7 builds on `68d7de3` (current main).

### Latest Tech Information

- **jsdom** ~26.x — DOM-environment for Vitest, works with React 19
- **@testing-library/react 16.3.2** — peer dep React 18 (stale), works with React 19. May need `--legacy-peer-deps`.
- **@testing-library/user-event** ~14.x — installed alongside RTL for future component tests

Sources: [@testing-library/react npm](https://www.npmjs.com/package/@testing-library/react), [Testing Library docs](https://testing-library.com/docs/react-testing-library/setup/)

### Project Structure Notes

**Alignment with architecture:**
- `src/lib/storage.ts` matches architecture's chosen location ✓
- `src/state/useHighScore.ts` matches `src/state/` directory (new) ✓
- localStorage boundary preserved ✓
- Hook return shape matches architecture pattern ✓

**Deviation:** jsdom + RTL installed in 1.7 instead of 1.9 (documented above).

### References

- **Story source:** `_bmad-output/planning-artifacts/epics.md` § "Epic 1, Story 1.7"
- **PRD FRs:** FR8 (high score persisted), FR47 (end-screen PB check), FR57 (silent degrade)
- **NFR8:** localStorage only state to persist
- **Architecture:** `_bmad-output/planning-artifacts/architecture.md` § "Cross-Cutting → localStorage wrapper", § "State & Reducer Patterns"
- **Previous story:** `_bmad-output/implementation-artifacts/1-6-pure-logic-modules.md`

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code)

### Debug Log References

**Node 26 / jsdom localStorage clash (resolved):**
- After installing `jsdom@29` (and again with `jsdom@26`), `localStorage` was `undefined` inside tests under `vite.config.ts → test.environment: 'jsdom'`.
- Root cause: Node 26 exposes an experimental `localStorage` global that is inert without `--localstorage-file`. Vitest 4's jsdom env uses `populateGlobal(global, dom.window)` which only copies window keys NOT already present on `global`. Since `'localStorage' in globalThis` is `true` on Node 26, Vitest skipped copying jsdom's real `localStorage` and the inert Node one shadowed it.
- Fix: added `vitest.setup.ts` that runs after jsdom env init and rebinds `globalThis.localStorage` (and `sessionStorage`) to `globalThis.jsdom.window.localStorage`. Registered via `test.setupFiles: ['./vitest.setup.ts']` in `vite.config.ts`.
- Also added `test.environmentOptions.jsdom.url = 'http://localhost/'` so the window has a real origin (Storage requires one).
- Dependency downgraded from `jsdom@29.1.1` (initial install) to `jsdom@26` to align with story spec — both versions exhibited the Node 26 conflict; downgrade was orthogonal to the fix but kept us on the version the spec called for.

**Architectural deviation realized:** jsdom + `@testing-library/react@16.3.2` + `@testing-library/user-event@14.6.1` installed; npm resolved peer deps cleanly without `--legacy-peer-deps`.

### Completion Notes List

- `src/lib/storage.ts` implemented per spec; sole `localStorage` touch point. 10 tests cover happy paths + Safari-style `Storage.prototype.setItem` throws path.
- `src/state/useHighScore.ts` is the project's first React hook (and the first file under `src/state/`). Returns `{ highScore, updateHighScore, hasStorage }` with `useCallback` + `useState` initializer pattern. 6 tests via `renderHook` + `act`.
- `vite.config.ts` now uses `jsdom` env with `url: 'http://localhost/'` and a setup file that fixes Node 26's inert-localStorage shadowing.
- `vitest.setup.ts` added at repo root.
- 67 tests pass total (51 prior + 10 storage + 6 hook). Production build clean. Bundle unchanged (193.35 kB / gzip 60.67 kB) — hook not yet consumed by any UI.

### File List

- **NEW** `src/lib/storage.ts`
- **NEW** `src/lib/storage.test.ts`
- **NEW** `src/state/useHighScore.ts`
- **NEW** `src/state/useHighScore.test.ts`
- **NEW** `vitest.setup.ts`
- **MODIFIED** `vite.config.ts` (env → jsdom, jsdom url option, setupFiles)
- **MODIFIED** `package.json` (devDependencies: jsdom@^26.1.0, @testing-library/react@^16.3.2, @testing-library/user-event@^14.6.1)
- **MODIFIED** `package-lock.json`

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-23 | Story created. Pulls jsdom + RTL install forward from planned Story 1.9 to keep useHighScore + storage testable in this story (NFR9 alignment). | bmad-create-story (Claude Opus 4.7) |
| 2026-05-23 | Story implemented and shipped. 67 tests pass (51 + 16 new). storage.ts + useHighScore.ts in place; `localStorage`-only access boundary preserved. Added `vitest.setup.ts` to rebind jsdom's localStorage onto globalThis (workaround for Node 26 inert experimental webstorage shadowing). | bmad-dev-story (Claude Opus 4.7) |
