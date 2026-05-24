# Story 1.8: Game Reducer + Provider + State Hook

Status: review

## Story

As a developer,
I want the `gameReducer` (pure) + `GameProvider` (React Context) + `useGameState` hook implemented,
so that every subsequent UI story consumes game state through a single clean interface and never touches Context directly.

## Acceptance Criteria

1. **`src/lib/gameReducer.ts` — pure reducer:**
   - Zero React imports, zero DOM access, zero I/O
   - Exports a discriminated-union `Action` type with exactly these variants: `START_GAME`, `ANSWER_QUESTION`, `USE_HINT`, `ADVANCE_TO_NEXT`, `FINISH_GAME`, `PLAY_AGAIN`
   - Exports `GameState` type, `GameQuestion` type (discriminated union over `mc` / `order` / `select`), `initialGameState` constant, and `gameReducer(state, action)` function
   - Composes the existing pure modules: `computePoints` (scoring.ts), `nextStreak` (streak.ts), `pickPool` (picker.ts) on `ANSWER_QUESTION`
   - Immutable updates only — never mutates the `state` argument
   - Invalid-phase actions return state unchanged (no throws)
   - `TOTAL_ROUNDS = 30` constant exported

2. **`src/lib/gameReducer.test.ts` — pure tests:**
   - Covers initial state, every action × phase combination, scoring × hint, streak edge cases, pool selection on each correct/wrong branch
   - Verifies immutability (returned state is a new reference for state-changing actions; same reference for no-op actions is acceptable)
   - Uses minimal fixture questions inline — never imports `data/questions/*.json`
   - All tests pass

3. **`src/state/GameProvider.tsx` — React Context wrapper:**
   - Exports `GameProvider` (component) and an internal Context (not re-exported — consumers must use the hook)
   - `GameProvider` takes only `children` as a prop; calls `useReducer(gameReducer, initialGameState)` and provides `{ state, dispatch }` via Context value
   - `useReducer` is the ONLY caller of `gameReducer` in the codebase (architecture boundary)

4. **`src/state/useGameState.ts` — consumer hook:**
   - Exports `useGameState()` returning `{ state, dispatch, helpers }`
   - `helpers` is an object of bound dispatch wrappers — one per action — so components never construct raw action objects: `startGame(questions)`, `answerQuestion(isCorrect)`, `useHint()`, `advanceToNext()`, `finishGame()`, `playAgain(questions)`
   - Throws a clear error when called outside `<GameProvider>` (standard Context pattern)

5. **`src/state/GameProvider.test.tsx` — integration tests via `renderHook`:**
   - `useGameState` outside the provider throws a recognizable error
   - Wrapped via `<GameProvider>`: state is `initialGameState`; helpers dispatch correctly; `startGame → useHint → answerQuestion → advanceToNext` sequence transitions phases as expected
   - Uses `@testing-library/react`'s `renderHook` with a `wrapper` option pointing at `GameProvider`

6. **Build + deploy unaffected:**
   - `npm test` exit 0 (existing 67 + new tests)
   - `npm run build` clean (prebuild + tsc + vite)
   - Bundle size unchanged (Provider not yet mounted in `App.tsx` — that wiring lands in Story 1.10's screen switcher)
   - Live site at `https://www.skilldares.com/` byte-identical

## Tasks / Subtasks

- [x] **Task 1: Pre-work safety check**
  - [x] Working tree clean (only untracked: `notes`)
  - [x] On `main`, up to date with `origin/main`
  - [x] Verify Story 1.7 in place: `src/state/useHighScore.ts`, `src/lib/storage.ts`, `vitest.setup.ts`; `npm test` shows 67 passing
  - [x] Create feature branch `story/1-8-game-reducer`

- [x] **Task 2: Implement `src/lib/gameReducer.ts`**
  - [x] Define `GameQuestion` discriminated union (`mc` / `order` / `select`)
  - [x] Define `GameState` type (see Dev Notes for exact shape)
  - [x] Define `Action` discriminated union (6 variants)
  - [x] Export `TOTAL_ROUNDS = 30` constant
  - [x] Export `initialGameState` constant
  - [x] Implement `gameReducer(state, action)` with exact handlers from Dev Notes
  - [x] `npx tsc --noEmit` clean

- [x] **Task 3: Write `src/lib/gameReducer.test.ts`**
  - [x] Inline fixture: small set of `GameQuestion` items (3 of each type or fewer)
  - [x] Initial state assertions
  - [x] START_GAME from 'start' → 'question'; from any other phase → no-op
  - [x] USE_HINT idempotent; sets flag only in 'question' phase
  - [x] ANSWER_QUESTION: correct/no-hint → +5; correct/hint → +2; wrong → +0
  - [x] ANSWER_QUESTION: streak transitions through 0→+1→+2→+3 and 0→-1→-2→-3
  - [x] ANSWER_QUESTION: pool selection on each branch (right-no-streak, on-fire, comeback, wrong-no-streak, streak-broken, doing-bad)
  - [x] ADVANCE_TO_NEXT mid-game increments roundIndex, resets hint flag, phase→'question'
  - [x] ADVANCE_TO_NEXT on last round → no-op (FINISH_GAME path)
  - [x] FINISH_GAME from last-round 'feedback' → phase='end'; otherwise no-op
  - [x] PLAY_AGAIN from 'end' resets score/streak/round/hint flag, sets new questions, phase='question'; otherwise no-op
  - [x] All tests pass: `npx vitest run src/lib/gameReducer.test.ts`

- [x] **Task 4: Implement `src/state/GameProvider.tsx`**
  - [x] Create file with internal Context (NOT exported) + `GameProvider` component
  - [x] Provide `{ state, dispatch }` via Context value
  - [x] Export ONLY `GameProvider` and the internal Context as a non-public `_GameStateContext` for the hook to import
  - [x] `npx tsc --noEmit` clean

- [x] **Task 5: Implement `src/state/useGameState.ts`**
  - [x] Import `_GameStateContext` from GameProvider
  - [x] Implement hook returning `{ state, dispatch, helpers }`
  - [x] Throw clear error if Context value is `null`
  - [x] All 6 helpers defined with `useMemo` (stable identity across renders)
  - [x] `npx tsc --noEmit` clean

- [x] **Task 6: Write `src/state/GameProvider.test.tsx`**
  - [x] Test 1: useGameState outside provider throws
  - [x] Test 2: useGameState inside provider returns initialGameState
  - [x] Test 3: helpers.startGame(questions) transitions to 'question' phase
  - [x] Test 4: helpers.useHint() then helpers.answerQuestion(true) produces correct score + feedback
  - [x] Test 5: full mini-game loop: startGame → answer → advanceToNext → answer → ... → finishGame → playAgain
  - [x] All tests pass: `npx vitest run src/state/GameProvider.test.tsx`

- [x] **Task 7: Full test suite + build verification**
  - [x] `npm test` — all tests pass (67 prior + new)
  - [x] `npm run build` — clean
  - [x] Bundle size unchanged (Provider not consumed by App.tsx yet)

- [x] **Task 8: Commit + push + verify deploy**
  - [x] Stage: `git add src/lib/gameReducer.ts src/lib/gameReducer.test.ts src/state/GameProvider.tsx src/state/useGameState.ts src/state/GameProvider.test.tsx`
  - [x] Commit message names the three new modules
  - [x] Fast-forward `main`, push, delete branch
  - [x] Add Story 1.8 spec to planning artifacts in a second commit
  - [x] Verify Amplify build clean

## Dev Notes

### Architecture Snapshot

This story implements the **state core** of the app. Three files; one is pure logic, two are React glue. After this story, every UI component built in Stories 1.10–3.x will read state and dispatch actions through `useGameState()` and never touch the Context, `useReducer`, or raw action objects directly.

**Boundary preserved:**
- Pure logic ↔ React: `gameReducer.ts` has zero React imports
- Reducer ↔ Provider: `useReducer(gameReducer, ...)` is the ONLY caller of `gameReducer`
- Provider ↔ Components: Components call `useGameState()`, never the Context

### Exact `GameState` Shape

```typescript
import type {
  MultipleChoiceQuestion,
  SpeedOrderQuestion,
  SpeedSelectQuestion,
} from './schemas/question.schema';
import type { MessagePoolId } from './schemas/message.schema';

export type GameQuestion =
  | { type: 'mc'; question: MultipleChoiceQuestion }
  | { type: 'order'; question: SpeedOrderQuestion }
  | { type: 'select'; question: SpeedSelectQuestion };

export type GamePhase = 'start' | 'question' | 'feedback' | 'end';

export type Feedback = {
  isCorrect: boolean;
  pool: MessagePoolId;
};

export type GameState = {
  phase: GamePhase;
  questions: GameQuestion[];  // length 30 once START_GAME fires; [] before
  roundIndex: number;         // 0-based index into questions; UI displays roundIndex + 1
  score: number;
  streak: number;             // signed; per FR4
  usedHintThisQuestion: boolean;
  lastFeedback: Feedback | null;  // populated by ANSWER_QUESTION, cleared by ADVANCE_TO_NEXT / PLAY_AGAIN
};

export const TOTAL_ROUNDS = 30;

export const initialGameState: GameState = {
  phase: 'start',
  questions: [],
  roundIndex: 0,
  score: 0,
  streak: 0,
  usedHintThisQuestion: false,
  lastFeedback: null,
};
```

### Exact `Action` Discriminated Union

```typescript
export type Action =
  | { type: 'START_GAME'; payload: { questions: GameQuestion[] } }
  | { type: 'ANSWER_QUESTION'; payload: { isCorrect: boolean } }
  | { type: 'USE_HINT' }
  | { type: 'ADVANCE_TO_NEXT' }
  | { type: 'FINISH_GAME' }
  | { type: 'PLAY_AGAIN'; payload: { questions: GameQuestion[] } };
```

### Reducer Handler Behavior (exact)

| Action | Valid in phase | Effect | Else |
|---|---|---|---|
| `START_GAME` | `'start'` | reset score/streak/round/hint/feedback, set `questions = payload.questions`, phase → `'question'` | no-op (return state unchanged) |
| `ANSWER_QUESTION` | `'question'` | `points = computePoints(isCorrect, state.usedHintThisQuestion)`; `pool = pickPool(state.streak, isCorrect)`; `newStreak = nextStreak(state.streak, isCorrect)`; update score/streak; set `lastFeedback = { isCorrect, pool }`; phase → `'feedback'` | no-op |
| `USE_HINT` | `'question'` AND `!usedHintThisQuestion` | set `usedHintThisQuestion = true` | no-op |
| `ADVANCE_TO_NEXT` | `'feedback'` AND `roundIndex < TOTAL_ROUNDS - 1` | `roundIndex += 1`, reset `usedHintThisQuestion = false`, clear `lastFeedback`, phase → `'question'` | no-op |
| `FINISH_GAME` | `'feedback'` AND `roundIndex === TOTAL_ROUNDS - 1` | phase → `'end'` | no-op |
| `PLAY_AGAIN` | `'end'` | reset everything (same as START_GAME but from end), set `questions = payload.questions`, phase → `'question'` | no-op |

**Key rule:** `pickPool` uses the PRE-update streak (`state.streak`), matching the FR38 logic ("If the streak immediately before this answer was…"). The picker module is already implemented this way — just pass `state.streak`, NOT `newStreak`.

**No-op behavior:** When an action is invalid for the current phase, the reducer returns the exact same `state` reference. Tests can use `expect(result).toBe(state)` for no-ops.

### Exact `GameProvider.tsx`

```typescript
import { createContext, useReducer, type ReactNode } from 'react';
import { gameReducer, initialGameState, type Action, type GameState } from '../lib/gameReducer';

type GameStateContextValue = {
  state: GameState;
  dispatch: React.Dispatch<Action>;
};

/**
 * Internal context — exported for the useGameState hook only.
 * Components MUST consume via useGameState, never directly.
 */
export const _GameStateContext = createContext<GameStateContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  return (
    <_GameStateContext.Provider value={{ state, dispatch }}>
      {children}
    </_GameStateContext.Provider>
  );
}
```

The `_` prefix on `_GameStateContext` is a soft naming convention signaling "internal — don't import directly." Linting won't catch it, but a reader sees the intent. The hook is the public API.

### Exact `useGameState.ts`

```typescript
import { useContext, useMemo } from 'react';
import { _GameStateContext } from './GameProvider';
import type { Action, GameQuestion, GameState } from '../lib/gameReducer';

export interface GameStateHelpers {
  startGame: (questions: GameQuestion[]) => void;
  answerQuestion: (isCorrect: boolean) => void;
  useHint: () => void;
  advanceToNext: () => void;
  finishGame: () => void;
  playAgain: (questions: GameQuestion[]) => void;
}

export interface UseGameStateResult {
  state: GameState;
  dispatch: React.Dispatch<Action>;
  helpers: GameStateHelpers;
}

export function useGameState(): UseGameStateResult {
  const ctx = useContext(_GameStateContext);
  if (ctx === null) {
    throw new Error('useGameState must be used inside <GameProvider>');
  }
  const { state, dispatch } = ctx;

  const helpers = useMemo<GameStateHelpers>(
    () => ({
      startGame: (questions) => dispatch({ type: 'START_GAME', payload: { questions } }),
      answerQuestion: (isCorrect) => dispatch({ type: 'ANSWER_QUESTION', payload: { isCorrect } }),
      useHint: () => dispatch({ type: 'USE_HINT' }),
      advanceToNext: () => dispatch({ type: 'ADVANCE_TO_NEXT' }),
      finishGame: () => dispatch({ type: 'FINISH_GAME' }),
      playAgain: (questions) => dispatch({ type: 'PLAY_AGAIN', payload: { questions } }),
    }),
    [dispatch],
  );

  return { state, dispatch, helpers };
}
```

### Test Pattern for GameProvider Tests (`renderHook` with wrapper)

```typescript
import { renderHook, act } from '@testing-library/react';
import { GameProvider } from './GameProvider';
import { useGameState } from './useGameState';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <GameProvider>{children}</GameProvider>
);

it('helpers.startGame transitions to question phase', () => {
  const { result } = renderHook(() => useGameState(), { wrapper });
  expect(result.current.state.phase).toBe('start');

  act(() => {
    result.current.helpers.startGame(makeFixtureQuestions());
  });

  expect(result.current.state.phase).toBe('question');
});
```

Use a `wrapper` option on `renderHook` — this is the standard RTL pattern for providers.

### Inline Fixture Pattern for Reducer Tests

The reducer tests must NOT import `data/questions/*.json` (architecture line 319). Build minimal fixture data inline:

```typescript
import type { GameQuestion } from './gameReducer';
import type { MultipleChoiceQuestion } from './schemas/question.schema';

const mcFixture: MultipleChoiceQuestion = {
  prompt: 'Test',
  options: ['a', 'b', 'c', 'd'],
  correctIndex: 0,
  funnyWrongIndex: 1,
  menuRefs: [],
};

function makeQuestions(count: number): GameQuestion[] {
  return Array.from({ length: count }, () => ({ type: 'mc', question: mcFixture }));
}
```

Use `makeQuestions(30)` (full-length) for tests that drive past the end of the game; use `makeQuestions(3)` or fewer for tests that only need a couple rounds.

### Why the Reducer Composes Picker/Streak/Scoring Itself

Per architecture line 474 (and FR38), the picker pool decision is part of "what happens when a question is answered." Keeping it inside the reducer:

1. Keeps the contract clean: one `ANSWER_QUESTION` action produces all the consequences (score change, streak change, pool decision)
2. Avoids cascading dispatches (which require side effects or double-renders)
3. Makes the reducer fully testable without React — feed an action, get the new state, assert
4. The actual message string is selected LATER by the FeedbackOverlay component using `pickMessage(messages, rng)` — that's where rng injection happens

### What This Story Does NOT Do

- **Does NOT mount `<GameProvider>` in `App.tsx`** — that's Story 1.10 (screen switcher). After this story, the Provider exists but the app still renders the default Vite landing page.
- **Does NOT select questions** — `selectGameQuestions(allMC, allOrder, allSelect, rng)` lands in Story 2.3. Until then, callers pass whatever `GameQuestion[]` they have (tests use fixtures).
- **Does NOT implement the timer** — `useTimer` lands in Story 2.5. Timer-expiry maps to `answerQuestion(false)` when wired up.
- **Does NOT render any UI** — pure state layer. Bundle size should not change.
- **Does NOT wire high-score updates** — `useHighScore` is consumed by EndScreen (Story 1.16); `FINISH_GAME` doesn't touch storage from the reducer (it's a side effect, per architecture line 339).

### Common LLM Mistakes to Avoid

- **Do NOT** put `if (isCorrect)` scoring logic in the reducer — use `computePoints(isCorrect, usedHint)` from `scoring.ts`
- **Do NOT** put streak math in the reducer — use `nextStreak(prev, isCorrect)` from `streak.ts`
- **Do NOT** put pool-selection if/else in the reducer — use `pickPool(prevStreak, isCorrect)` from `picker.ts`
- **Do NOT** pass `newStreak` to `pickPool` — pass the PRE-update `state.streak` (FR38 says "immediately before this answer")
- **Do NOT** import `data/questions/*.json` in tests — use inline fixtures (architecture line 319)
- **Do NOT** export `_GameStateContext` from a barrel/index — keep it module-local-ish; only the hook imports it
- **Do NOT** add a `clearFeedback` action — `ADVANCE_TO_NEXT` and `PLAY_AGAIN` clear `lastFeedback` as part of their normal effect
- **Do NOT** use `interface` for these types — use `type` (architecture line 330)
- **Do NOT** throw inside the reducer for invalid actions — return state unchanged (permissive, easy to test, easy to debug)
- **Do NOT** use `structuredClone` for these shallow updates — spread (`{ ...state, score: ... }`) is enough; the state is shallow enough that no nested mutation risk exists
- **Do NOT** call `pickMessage` in the reducer — message string selection happens in the FeedbackOverlay component (Story 1.13) with injected rng
- **Do NOT** wrap helpers in `useCallback` individually — `useMemo` on the helpers object gives stable identity for the whole bag with one dep (dispatch)

### Testing Standards

- Vitest + jsdom (already configured in Story 1.7)
- Co-locate tests: `gameReducer.test.ts` alongside `gameReducer.ts`; `GameProvider.test.tsx` alongside `GameProvider.tsx`
- Use `renderHook` + `act` for Provider tests
- Use `wrapper` option (not manual wrapping per-test)
- `expect(...).toBe(state)` for no-op identity checks; `expect(...).toEqual(...)` for value equality
- Inline minimal fixtures, never `data/questions/*.json`

### Previous Story Intelligence

**From Story 1.6 (pure modules):**
- Pattern: explicit imports from `vitest` (`globals: false`), `import { describe, it, expect } from 'vitest'`
- `Rng` injection pattern established — but `gameReducer` doesn't need rng (no random decisions in it)
- Tests passed under `node` env originally; Story 1.7 flipped env to `jsdom` and added `vitest.setup.ts` (Node-26 localStorage workaround). Reducer tests run fine under jsdom — no DOM dependency.

**From Story 1.7 (storage + first hook):**
- Hook return shape: typed object, not tuple (`{ highScore, updateHighScore, hasStorage }`)
- `useState` initializer function for one-time setup
- `useCallback` for stable function identity to consumers
- Tests use `renderHook` + `act`; `localStorage.clear()` in `beforeEach` for isolation
- `_GameStateContext` pattern: prefix with `_` to signal "internal."

### Git Intelligence

Last 4 commits on main:

```
e56e090 Add Story 1.7 dev spec to planning artifacts
7ae55ea Story 1.7: localStorage wrapper + useHighScore hook + jsdom test env
68d7de3 Add Story 1.6 dev spec to planning artifacts
50bd770 Story 1.6: pure logic modules (scoring, streak, picker, questionSelection) + Vitest
```

Story 1.8 builds on `e56e090`.

### Latest Tech Information

- **React 19.2.0** — `useReducer<Reducer<State, Action>>` typing is stable; `Action` is a discriminated union so TypeScript narrows `action.payload` correctly per case
- **@testing-library/react 16.3.2** — `renderHook(callback, { wrapper })` API stable since v13
- No new dependencies required

### Project Structure Notes

**Alignment with architecture:**
- `src/lib/gameReducer.ts` matches architecture's listed location ✓
- `src/state/GameProvider.tsx` + `useGameState.ts` match architecture's `src/state/` ✓
- Discriminated-union actions per architecture line 333 ✓
- Reducer purity per architecture line 334 ✓
- Single source of truth via `z.infer<>` for question types (already done in schemas) ✓
- `type` not `interface` per architecture line 330 ✓

No deviations from architecture.

### References

- **Story source:** `_bmad-output/planning-artifacts/epics.md` § "Epic 1, Story 1.8"
- **PRD FRs:** FR1 (30 rounds), FR4 (game state shape), FR5 (no persistence), FR25–FR29 (hint), FR30–FR34 (scoring), FR38 (pool selection), FR40 (streak reset), FR48 (Play Again)
- **Architecture:** §"State & Reducer Patterns", §"Architectural Boundaries", §"What Agents MUST Do", §"Requirements → File Mapping" (F1)
- **Previous stories:** `1-6-pure-logic-modules.md`, `1-7-storage-high-score-hook.md`
- **Pure modules consumed:** `src/lib/scoring.ts` (computePoints), `src/lib/streak.ts` (nextStreak), `src/lib/picker.ts` (pickPool)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code)

### Debug Log References

**Provider mini-game-loop test hung initially:**
- Symptom: `npx vitest run src/state/GameProvider.test.tsx` timed out at 19s in the full-loop test ("Worker exited unexpectedly").
- Cause: I used `while (result.current.state.roundIndex < TOTAL_ROUNDS - 1)` *inside* a single `act()` block. Inside one act, dispatched updates batch and `result.current` doesn't refresh until act returns — so `roundIndex` reads stale `0` forever and the loop never exits.
- Fix: rewrote as a `for` loop with each `answerQuestion` + `advanceToNext` pair wrapped in its own `act()`. Each act flushes the React update, then the loop reads the fresh `result.current`. Lesson recorded.

**Build caught unused import:**
- `gameReducer.test.ts` imported the `Action` type but never used it. `tsc -b` (build step) is stricter than `tsc --noEmit` and rejected it. Removed the unused import.

### Completion Notes List

- `src/lib/gameReducer.ts` — pure reducer, 6 action variants, immutable updates, invalid-phase actions return same state reference. Composes `computePoints` / `nextStreak` / `pickPool` from earlier stories. `TOTAL_ROUNDS = 30`.
- `src/state/GameProvider.tsx` — Context wrapping `useReducer(gameReducer, initialGameState)`. Internal `_GameStateContext` (underscore-prefixed) marks it as hook-only.
- `src/state/useGameState.ts` — consumer hook returning `{ state, dispatch, helpers }`. Six helpers (`startGame`, `answerQuestion`, `useHint`, `advanceToNext`, `finishGame`, `playAgain`) via `useMemo` for stable identity. Throws clear error outside Provider.
- Tests: 34 reducer + 6 Provider = 40 new. Combined suite: **107 passing** (67 prior + 40 new).
- Build clean. Bundle size **unchanged** at 193.35 kB / gzip 60.67 kB — Provider is not yet mounted in `App.tsx` (Story 1.10 will wire it up).
- No new dependencies. No deviations from architecture.

### File List

- **NEW** `src/lib/gameReducer.ts`
- **NEW** `src/lib/gameReducer.test.ts`
- **NEW** `src/state/GameProvider.tsx`
- **NEW** `src/state/useGameState.ts`
- **NEW** `src/state/GameProvider.test.tsx`

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-23 | Story created. Pure reducer + Provider + consumer hook; composes existing scoring/streak/picker modules; no UI wiring (deferred to Story 1.10 screen switcher). | bmad-create-story (Claude Opus 4.7) |
| 2026-05-23 | Story implemented and shipped. 107 tests pass (67 prior + 34 reducer + 6 Provider). All ACs satisfied. Bundle unchanged. | bmad-dev-story (Claude Opus 4.7) |
