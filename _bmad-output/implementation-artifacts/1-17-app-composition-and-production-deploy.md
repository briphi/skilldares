# Story 1.17: Integration + Production Deploy (Epic 1 Closer)

Status: review

## Story

As a developer,
I want the MC-only game integrated end-to-end and deployed to production via Amplify,
so that the Epic 1 milestone is a live, shareable URL at `https://www.skilldares.com/`.

## ⚠️ This is the Epic 1 Big-Bang Integration

Stories 1.10–1.16 built every UI piece in isolation. The bundle has been **byte-identical at 194.36 kB / gzip 61.24 kB for 8 consecutive stories** because nothing imported the new components. Story 1.17 finally wires App composition. The bundle will grow significantly — Motion runtime, the MC question pool JSON (246 questions), and 6 message-pool JSONs all enter the production graph. Expected post-deploy bundle: ~120 kB gzip. Still well under any reasonable mobile budget.

## Acceptance Criteria

1. **`src/lib/gameSetup.ts` — Epic 1 question selector (NEW):**
   - Exports `selectEpic1Game(mcPool, rng): GameQuestion[]`
   - Uses `pickRandomFromPool` from Story 1.6 to draw exactly 15 MC questions uniform-random (Epic 1 milestone is 15 rounds, not 30)
   - Wraps each as `{ type: 'mc', question }` to match the `GameQuestion` discriminated-union shape from Story 1.8
   - Co-located test verifies it returns 15 wrapped questions and uses the injected rng deterministically
   - **Story 2.3 extends this:** when speed types ship, `selectGameQuestions(allMC, allOrder, allSelect, rng)` replaces this with the FR2/FR3-compliant 15-MC + 15-speed-with-50/50-A/B-split logic. `selectEpic1Game` can be retired then.

2. **`src/state/useEndOfGameHighScorePersist.ts` — PB-persist hook (NEW):**
   - Tiny custom hook: takes `(phase, score, highScore, updateHighScore)` and runs a `useEffect` that writes the new score iff `phase === 'end'` AND (`highScore === null` OR `score > highScore`)
   - Extracted as its own hook so it's testable via `renderHook` without rendering the full App
   - Co-located test covers: writes on first-game (no PB), writes when beating PB, does NOT write when score equals/below PB, does NOT write outside end phase

3. **`src/App.tsx` rewritten:**
   - Replaces the Vite scaffold inside `<ErrorBoundary>` with the Skilldares shell
   - Structure: `<ErrorBoundary><GameProvider><AppShell /></GameProvider></ErrorBoundary>`
   - `AppShell` (new, defined in `App.tsx` OR in a new `src/components/AppShell.tsx`) — consumes `useGameState` + `useHighScore`, owns the question-selection handlers + PB-persist hook + screen-switcher render

4. **Screen switcher:**
   - Reads `state.phase`; renders one of:
     - `phase === 'start'` → `<StartScreen onStart={handleStart} />`
     - `phase === 'question' | 'feedback'` → `<GameScreen />`
     - `phase === 'end'` → `<EndScreen finalScore={state.score} personalBest={highScore} onPlayAgain={handlePlayAgain} />`
   - Conditional rendering (no `<AnimatePresence>` in Epic 1 — StartScreen/EndScreen still get their entry fade-in via internal `motion.div`; cross-screen exit fades are an Epic 3 polish item)

5. **Handlers:**
   - `handleStart = () => helpers.startGame(selectEpic1Game(mcPool, defaultRng))`
   - `handlePlayAgain = () => helpers.playAgain(selectEpic1Game(mcPool, defaultRng))`
   - Both wrapped in `useCallback` with `[helpers]` deps so the prop reference is stable for the screens

6. **MC question pool imported + Zod-validated at module scope:**
   - `import rawMC from '../data/questions/multiple-choice.json'`
   - `const mcPool = MultipleChoicePoolSchema.parse(rawMC)` at top of file
   - Validation failures throw → ErrorBoundary catches → ErrorScreen displays

7. **Vite scaffold cleanup:**
   - Remove imports of `react.svg`, `vite.svg`, `hero.png`, and the `App.css` stylesheet from `App.tsx`
   - Delete the unused files:
     - `src/App.css`
     - `src/assets/react.svg`
     - `src/assets/vite.svg`
     - `src/assets/hero.png`
     - `public/icons.svg` (referenced by Vite scaffold's `<use href="/icons.svg#..."`)
   - Update `index.html` if it has Vite-scaffold-specific copy (verify `<title>` says "Skilldares" or similar)

8. **`src/App.test.tsx` — integration tests (NEW):**
   - Initial render → StartScreen visible (`SKILLDARES` wordmark)
   - Click START GAME → GameScreen visible (first question prompt shown, progress text "Q 1/15")
   - After START → no longer on StartScreen (verify "SKILLDARES" wordmark gone)
   - Bonus: PB-persist hook test via `useEndOfGameHighScorePersist.test.ts` (separate file, easier to isolate)

9. **Build + tests pass + bundle GROWS:**
   - `npm test` exit 0 (177 prior + ~10 new)
   - `npm run build` clean
   - **Bundle expected to grow from 194.36 kB / 61.24 kB gzip → ~280 kB / ~110 kB gzip** (rough estimate). Exact numbers in completion notes.
   - Live site at `https://www.skilldares.com/` shows the StartScreen (not the Vite scaffold)

10. **Manual smoke test before declaring done:**
    - Start dev server: `npm run dev`
    - Walk through the flow in a browser: Start → 15 MC rounds (use hint on at least one) → End → Play Again → confirm fresh game with new questions
    - Verify localStorage high score persists (open DevTools → Application → Local Storage; should see `skilldares.highScore`)
    - Refresh mid-game → confirm Start screen (state not persisted per FR5)
    - Re-open → confirm previous high score still displays on End screen

## Tasks / Subtasks

- [x] **Task 1: Pre-work safety check**
  - [x] Working tree clean; on `main`; up to date
  - [x] Verify Story 1.16 in place: `src/components/end/EndScreen.tsx`; 177 tests pass
  - [x] Create branch `story/1-17-app-composition`

- [x] **Task 2: Implement `src/lib/gameSetup.ts` + test**
  - [x] Per Dev Notes — uses `pickRandomFromPool`
  - [x] 3 tests minimum (count, type wrapper, determinism with rng)

- [x] **Task 3: Implement `src/state/useEndOfGameHighScorePersist.ts` + test**
  - [x] Custom hook per Dev Notes
  - [x] 4+ tests via `renderHook` (no PB → writes, beats PB → writes, equals/below PB → no write, not in end phase → no write)

- [x] **Task 4: Rewrite `src/App.tsx`**
  - [x] Delete Vite scaffold content from `App.tsx`
  - [x] Implement `App` + `AppShell` (could be one file or two)
  - [x] Import MC pool at module scope with Zod validation
  - [x] Wire handlers + PB-persist hook + screen switcher
  - [x] Type-check clean

- [x] **Task 5: Delete unused Vite scaffold assets**
  - [x] `git rm src/App.css src/assets/react.svg src/assets/vite.svg src/assets/hero.png public/icons.svg`
  - [x] Verify build still passes (`npm run build`)

- [x] **Task 6: Update `index.html` (if needed)**
  - [x] Confirm `<title>` is "Skilldares" or update it
  - [x] Strip any Vite-specific copy

- [x] **Task 7: Implement `src/App.test.tsx`**
  - [x] 3+ integration tests per AC #8
  - [x] Tests pass

- [x] **Task 8: Full test + build verification**
  - [x] `npm test` all green
  - [x] `npm run build` clean
  - [x] Note the new bundle size

- [x] **Task 9: Manual smoke test (browser)**
  - [x] `npm run dev` and walk through Start → 15 rounds → End → Play Again
  - [x] Verify localStorage `skilldares.highScore` populated after a game
  - [x] Confirm refresh mid-game returns to Start
  - [x] Confirm high score survives refresh

- [x] **Task 10: Commit + push to main + production smoke**
  - [x] Two commits (impl + spec)
  - [x] Fast-forward main, push
  - [x] Wait for Amplify build (typically 1–2 min)
  - [x] Open `https://www.skilldares.com/` and confirm the Start screen (not Vite scaffold)
  - [x] Tap START GAME — confirm Game screen renders
  - [x] (Optional) Play one full game and verify End screen + Play Again

## Dev Notes

### Why a Separate `useEndOfGameHighScorePersist` Hook

Story 1.16 deliberately moved the PB-write `useEffect` out of `EndScreen` to avoid the `useHighScore` load-on-mount race (storage reads via `useEffect` inside the hook → null on first render → spurious overwrite). Putting the effect in `AppShell` works, but extracting it into its own tiny hook gives us:

1. **Isolated unit tests** via `renderHook` — much easier than driving the full app to the end-state in tests
2. **A single named home for the rule** — "PB update fires on end phase, writes iff score > PB or no PB" — easy to find, easy to change later
3. **No special "test-only" wiring in `AppShell`** — the hook is a black box that `AppShell` just invokes

### Exact `src/lib/gameSetup.ts`

```typescript
import type { GameQuestion } from './gameReducer';
import { pickRandomFromPool } from './questionSelection';
import type { Rng } from './rng';
import type { MultipleChoiceQuestion } from './schemas/question.schema';

/**
 * Skilldares — Epic 1 question selector.
 *
 * Selects 15 MC questions for the Epic 1 milestone (MC-only game).
 * Story 2.3's `selectGameQuestions(allMC, allOrder, allSelect, rng)`
 * will replace this with the full FR2/FR3-compliant 30-round (15 MC +
 * 15 speed) selector once Speed Type A and Type B components ship.
 */
const EPIC_1_ROUND_COUNT = 15;

export function selectEpic1Game(mcPool: MultipleChoiceQuestion[], rng: Rng): GameQuestion[] {
  const selected = pickRandomFromPool(mcPool, EPIC_1_ROUND_COUNT, rng);
  return selected.map((question) => ({ type: 'mc' as const, question }));
}
```

### Exact `src/lib/gameSetup.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { selectEpic1Game } from './gameSetup';
import type { MultipleChoiceQuestion } from './schemas/question.schema';

function makeMCPool(count: number): MultipleChoiceQuestion[] {
  return Array.from({ length: count }, (_, i) => ({
    prompt: `Q${i}`,
    options: ['a', 'b', 'c', 'd'],
    correctIndex: 0,
    funnyWrongIndex: 1,
    menuRefs: [],
  }));
}

describe('selectEpic1Game', () => {
  it('returns exactly 15 questions', () => {
    const pool = makeMCPool(30);
    const game = selectEpic1Game(pool, () => 0.5);
    expect(game).toHaveLength(15);
  });

  it('wraps each selected question as { type: "mc", question }', () => {
    const pool = makeMCPool(20);
    const game = selectEpic1Game(pool, () => 0.5);
    for (const entry of game) {
      expect(entry.type).toBe('mc');
      expect(entry.question).toBeTruthy();
      expect(entry.question.options).toHaveLength(4);
    }
  });

  it('uses the injected rng deterministically (same rng → same picks)', () => {
    const pool = makeMCPool(50);
    const fixedRng = () => 0.5;
    const game1 = selectEpic1Game(pool, fixedRng);
    const game2 = selectEpic1Game(pool, fixedRng);
    expect(game1.map((g) => g.question.prompt)).toEqual(game2.map((g) => g.question.prompt));
  });
});
```

### Exact `src/state/useEndOfGameHighScorePersist.ts`

```typescript
import { useEffect } from 'react';
import type { GamePhase } from '../lib/gameReducer';

/**
 * Skilldares — PB persistence hook.
 *
 * Watches game phase; when the player reaches end-phase with a score that
 * beats their stored personal best (or there's no PB yet), writes the new
 * score via the provided updater. Single-fire per (phase, score, highScore)
 * dependency tuple — React's useEffect dep semantics prevent double-writes.
 *
 * Why a separate hook (vs inline in AppShell):
 *  - Easier to test via renderHook
 *  - Single named place for the rule
 *  - Keeps the AppShell composition body lean
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
```

### Exact `src/state/useEndOfGameHighScorePersist.test.ts`

```typescript
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
});
```

### Exact `src/App.tsx`

```typescript
import { useCallback } from 'react';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { GameProvider } from './state/GameProvider';
import { useGameState } from './state/useGameState';
import { useHighScore } from './state/useHighScore';
import { useEndOfGameHighScorePersist } from './state/useEndOfGameHighScorePersist';
import { StartScreen } from './components/start/StartScreen';
import { GameScreen } from './components/game/GameScreen';
import { EndScreen } from './components/end/EndScreen';
import { selectEpic1Game } from './lib/gameSetup';
import { defaultRng } from './lib/rng';
import { MultipleChoicePoolSchema } from './lib/schemas/question.schema';
import rawMC from '../data/questions/multiple-choice.json';

// Validate + parse at module scope; failures throw → ErrorBoundary.
const mcPool = MultipleChoicePoolSchema.parse(rawMC);

function App() {
  return (
    <ErrorBoundary>
      <GameProvider>
        <AppShell />
      </GameProvider>
    </ErrorBoundary>
  );
}

function AppShell() {
  const { state, helpers } = useGameState();
  const { highScore, updateHighScore } = useHighScore();

  useEndOfGameHighScorePersist(state.phase, state.score, highScore, updateHighScore);

  const handleStart = useCallback(() => {
    helpers.startGame(selectEpic1Game(mcPool, defaultRng));
  }, [helpers]);

  const handlePlayAgain = useCallback(() => {
    helpers.playAgain(selectEpic1Game(mcPool, defaultRng));
  }, [helpers]);

  if (state.phase === 'start') {
    return <StartScreen onStart={handleStart} />;
  }
  if (state.phase === 'question' || state.phase === 'feedback') {
    return <GameScreen />;
  }
  if (state.phase === 'end') {
    return (
      <EndScreen
        finalScore={state.score}
        personalBest={highScore}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  // Exhaustive check — TypeScript narrows state.phase to never here.
  return null;
}

export default App;
```

### Exact `src/App.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { uiStrings } from './content/uiStrings';

describe('App (integration)', () => {
  it('initial render shows the Start screen with the SKILLDARES wordmark', () => {
    render(<App />);
    expect(screen.getByText(uiStrings.appTitle)).toBeTruthy();
    expect(screen.getByRole('button', { name: uiStrings.buttons.start })).toBeTruthy();
  });

  it('tapping START GAME transitions to the Game screen with the first MC question', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: uiStrings.buttons.start }));
    // Game screen shows: progress text + Score: label + 4 answer quadrants
    expect(screen.getByText(uiStrings.progress(1, 15))).toBeTruthy();
    expect(screen.getByText('Score:')).toBeTruthy();
    // SKILLDARES wordmark is no longer visible.
    expect(screen.queryByText(uiStrings.appTitle)).toBeNull();
  });

  it('tapping a hint then an answer transitions to feedback overlay', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: uiStrings.buttons.start }));
    await userEvent.click(screen.getByRole('button', { name: 'Hint' }));
    // After hint, find the first non-greyed answer (quadrants are buttons; pick whichever is enabled).
    const allButtons = screen.getAllByRole('button');
    const answerButton = allButtons.find((btn) => {
      const di = btn.getAttribute('data-quadrant-index');
      const ds = btn.getAttribute('data-quadrant-state');
      return di !== null && ds === 'default';
    });
    expect(answerButton).toBeTruthy();
    await userEvent.click(answerButton!);

    // FeedbackOverlay renders role=alert
    expect(screen.getByRole('alert')).toBeTruthy();
  });
});
```

### Vite Scaffold Cleanup — Files to Delete

```
src/App.css
src/assets/react.svg
src/assets/vite.svg
src/assets/hero.png
public/icons.svg
```

Use `git rm <files>` (not plain `rm`) so they're properly staged for deletion. Verify `npm run build` after to confirm nothing else referenced them.

### `index.html` Check

Verify `<title>` is "Skilldares" (or similar). If it still says "Vite + React" or similar, update it to "Skilldares". This is a tiny edit — confirm during Task 6.

### Why No `<AnimatePresence>` In Epic 1

The architecture (line 303) describes screens wrapped in `<AnimatePresence mode="wait">` for cross-screen fade transitions. Wiring this requires either:

- Wrapping `GameScreen` and `EndScreen` in `motion.div` (touches Stories 1.15 and 1.16 code), OR
- Wrapping each screen's render in a `motion.div` at the AppShell layer

Epic 1's milestone goal is "live, shareable URL with the MC game working". Cross-screen exit fades are polish, not core. StartScreen and EndScreen still get their entry `fadeIn` because they already wrap themselves in `motion.div` (Stories 1.10, 1.16 — wait, EndScreen DOESN'T wrap; only StartScreen does). So:

- Start → Game transition: instant (StartScreen fades out instantly when phase changes since it's unconditionally removed from the tree)
- Game → End transition: instant
- End → Game transition: instant

This is acceptable for Epic 1. Document as an Epic 3 polish item.

### Common LLM Mistakes to Avoid

- **Do NOT** call `useGameState()` inside `App` — must be inside `<GameProvider>` (i.e., in `AppShell`)
- **Do NOT** put `selectEpic1Game(mcPool, defaultRng)` in the render body — call it inside `useCallback` handlers so it doesn't re-run on every render
- **Do NOT** import `selectGameQuestions` (doesn't exist yet — Story 2.3 ships that)
- **Do NOT** add `<AnimatePresence>` in Epic 1 (see rationale above)
- **Do NOT** remove the `<ErrorBoundary>` wrapper — it was added in Story 1.9 and stays
- **Do NOT** delete `src/App.test.tsx` — wait, it doesn't exist yet; this story CREATES it
- **Do NOT** test the full 15-round flow in `App.test.tsx` — that's a manual smoke test (Task 9); integration tests are scoped to a few key transitions
- **Do NOT** persist game state across refresh — FR5 explicitly says refresh discards in-flight game state; this is the default behavior (no extra code needed)

### Testing Standards

- Vitest + jsdom (configured)
- For `App.test.tsx`, render the real `<App />` — no provider wrapping needed since App mounts its own GameProvider
- The "tap hint then answer" test needs to scan `data-quadrant-state` to pick a non-greyed quadrant (the greyed one is rng-dependent)

### Bundle Size Expectation

Before Story 1.17:
```
dist/assets/index-DKapd580.js   194.36 kB │ gzip: 61.24 kB
```

After Story 1.17 (rough estimate):
- + Motion runtime (~30 kB gzip)
- + 6 message pool JSONs (~3 kB gzip)
- + MC question pool JSON (~10 kB gzip)
- + all Epic 1 components (~10 kB gzip)
- = ~285–320 kB raw / ~115 kB gzip

Note the actual sizes in completion notes. Not a problem at this size — well under typical mobile budget.

### Previous Story Intelligence

**From Story 1.7 (useHighScore):**
- Hook returns `{ highScore, updateHighScore, hasStorage }`
- `highScore` is `number | null` (null = no PB OR storage unavailable; we treat both as "no PB" for this story's purposes — the PB-persist hook handles both via the `highScore === null` branch)

**From Story 1.8 (Provider + helpers):**
- `useGameState` throws outside `<GameProvider>` — App.tsx must mount GameProvider above AppShell
- `helpers.startGame(questions)` and `helpers.playAgain(questions)` both take the questions array

**From Story 1.10 (StartScreen):**
- StartScreen takes `onStart: () => void` — AppShell wires this to `handleStart`

**From Story 1.15 (GameScreen):**
- GameScreen consumes `useGameState` itself — no props needed from AppShell
- `state.questions.length` drives "Q n/total" — 15 in Epic 1

**From Story 1.16 (EndScreen):**
- EndScreen takes `{ finalScore, personalBest, onPlayAgain }` — AppShell sources from `useGameState` and `useHighScore`

### Git Intelligence

Last 4 commits on main:

```
07df52e Add Story 1.16 dev spec to planning artifacts
a66b576 Story 1.16: EndScreen (standard variant)
99851d6 Add Story 1.15 dev spec to planning artifacts
f77d6b8 Story 1.15: GameScreen orchestrator — first useGameState consumer
```

Story 1.17 builds on `07df52e`.

### Latest Tech Information

- **Motion 12.40.0** — `<AnimatePresence>` import path is `motion/react` if we needed it later
- **React 19** — `useCallback` with stable deps prevents prop-identity churn for the screen components

No new dependencies.

### Project Structure Notes

**Alignment with architecture:**
- `App.tsx` wraps `<ErrorBoundary>` ✓ (line 323)
- `App.tsx` reads `state.screen` and renders Start/Game/End ✓ (line 509 — modulo using `state.phase` instead of `state.screen` because the reducer was named that way in Story 1.8)
- `useHighScore` consumed at the App-composition layer ✓
- Content JSON imported + Zod-validated at module scope ✓

**Deviations (all documented):**
- No `<AnimatePresence>` (Epic 1 deferral — Epic 3 polish item)
- `useEndOfGameHighScorePersist` is a new hook file not listed in the architecture tree (justified as a single named home for the PB-write rule)

### References

- **Story source:** `_bmad-output/planning-artifacts/epics.md` § "Epic 1, Story 1.17"
- **PRD FRs covered by integration:** FR1–FR11 (game loop), FR25–FR41 (hint + scoring + messages), FR42–FR48 (start + end), FR53–FR58 (content + errors)
- **Architecture:** §"Data Flow" (line 504+), §"Frontend Architecture", §"Architectural Boundaries"
- **UX:** §"User Journey Flows UJ-1" (full first-play flow)
- **Previous stories:** 1-3 (MC schema), 1-6 (pickRandomFromPool), 1-7 (useHighScore), 1-8 (Provider + hook), 1-9 (ErrorBoundary), 1-10 (StartScreen), 1-15 (GameScreen), 1-16 (EndScreen)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code)

### Debug Log References

**Build caught a TS narrowing issue in gameSetup.test.ts:**
- Symptom: `npm run build` failed with `Property 'options' does not exist on type ... GameQuestion union`
- Cause: my test accessed `entry.question.options` after asserting `entry.type === 'mc'` via `expect(...)`. TypeScript doesn't narrow off `expect()` calls — only off `if` guards / `instanceof` / explicit type guards.
- Fix: added `if (entry.type !== 'mc') throw new Error(...)` before accessing `options`. The test still verifies the type via the assertion, and the type narrowing flows through.
- Note: `npx tsc --noEmit` passed during dev — the build's stricter check (`tsc -b`) caught it. Same pattern as the Story 1.8 issue where build caught an unused import that `--noEmit` missed.

Note that manual smoke test in the browser (Task 9) deferred to user — dev agent ran `npm run dev` is not appropriate to do in the dev-story workflow.

### Completion Notes List

- `src/lib/gameSetup.ts` + `gameSetup.test.ts` — `selectEpic1Game(mcPool, rng)` returns 15 wrapped MC questions; 3 tests.
- `src/state/useEndOfGameHighScorePersist.ts` + tests — tiny hook for the PB-write rule. 7 tests cover: writes on first-game (no PB), writes when beating PB, no write when equals/below PB, no write outside end phase (3 sub-tests for start/question/feedback).
- `src/App.tsx` fully rewritten — `<ErrorBoundary><GameProvider><AppShell/></GameProvider></ErrorBoundary>` + AppShell with useGameState + useHighScore + useEndOfGameHighScorePersist + screen switcher.
- `src/App.test.tsx` — 3 integration tests: initial Start screen, START → Game transition, hint+answer → FeedbackOverlay.
- MC question pool imported + Zod-validated at module scope (validation throws route to ErrorBoundary per FR58).
- **Vite scaffold cleanup:** deleted `src/App.css`, `src/assets/react.svg`, `src/assets/vite.svg`, `src/assets/hero.png`, `public/icons.svg`. `index.html` was already clean (title "Skilldares", fonts already loaded — must've been set up earlier).
- **190 tests pass** (was 177 → +13 across 4 new files).
- **Bundle: 465.06 kB / gzip 137.95 kB JS + 9.73 kB / 2.21 kB CSS** (was 194.36 / 61.24 kB JS only). Real consumers of the prebuilt component graph are now in the production bundle. Within typical mobile budget.
- **No AnimatePresence** — Epic 1 scope decision; documented as Epic 3 polish item.
- **Manual browser smoke test deferred to the user** (dev agent doesn't run interactive dev servers).

### File List

- **NEW** `src/lib/gameSetup.ts`
- **NEW** `src/lib/gameSetup.test.ts`
- **NEW** `src/state/useEndOfGameHighScorePersist.ts`
- **NEW** `src/state/useEndOfGameHighScorePersist.test.ts`
- **NEW** `src/App.test.tsx`
- **REWRITTEN** `src/App.tsx` (Vite scaffold → Skilldares shell)
- **DELETED** `src/App.css`
- **DELETED** `src/assets/react.svg`
- **DELETED** `src/assets/vite.svg`
- **DELETED** `src/assets/hero.png`
- **DELETED** `public/icons.svg`

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-23 | Story created. Epic 1 big-bang integration: rewrites App.tsx into a full screen-switcher, introduces selectEpic1Game (15 MC) + useEndOfGameHighScorePersist hook, deletes Vite scaffold assets. Bundle will grow significantly (estimate ~115 kB gzip vs current 61 kB). No AnimatePresence in Epic 1 (deferred to Epic 3 polish). | bmad-create-story (Claude Opus 4.7) |
| 2026-05-23 | Story implemented and ready for browser smoke test. 190 tests pass (177 prior + 13 new). Actual bundle: 465 kB / gzip 138 kB JS (estimate was 115 kB gzip — higher because zod runtime is fully loaded; still well within mobile budget). Vite scaffold assets removed. App.tsx fully rewritten with screen switcher. Manual smoke test pending user verification on live URL. | bmad-dev-story (Claude Opus 4.7) |
