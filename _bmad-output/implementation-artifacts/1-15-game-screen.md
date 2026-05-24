# Story 1.15: Game Screen Orchestrator

Status: review

## Story

As a player,
I want the gameplay UI assembled so that the question, score, hint, and feedback all work as a single coherent screen,
so that round-to-round play feels seamless.

## ⚠️ First component to consume `useGameState`

Up through Story 1.14, every UI component took its data via props (decoupled from the reducer). GameScreen is the **first** to read state through `useGameState()` — it's the integration point. From here, it threads state and dispatch helpers down to the pure presentational components built in Stories 1.10–1.14.

## Acceptance Criteria

1. **`src/components/game/GameScreen.tsx` exists:**
   - No props (besides optional `rng?: Rng` for testability)
   - Reads `{ state, helpers }` via `useGameState()`
   - Defaults `rng` to `defaultRng`; tests can inject for deterministic message selection

2. **Layout: header + body + footer:**
   - **Header (top):** progress text ("Q 5/30") on the left + `<ScoreDisplay />` on the right
   - **Body (center):** during `phase === 'question'` → `<QuestionMC />` (when `currentQuestion.type === 'mc'`); during `phase === 'feedback'` → `<FeedbackOverlay />`
   - **Footer (bottom):** `<HintButton />` (only visible during `phase === 'question'` on MC; never on FeedbackOverlay)

3. **Progress text uses `uiStrings.progress(round, total)`:**
   - `total` = `state.questions.length` (so a 15-round Epic 1 milestone game shows "Q 5/15", a full 30-round game shows "Q 5/30")
   - `round` = `state.roundIndex + 1` (1-based display)

4. **Question rendering (MC only for Epic 1):**
   - When `phase === 'question'` AND `currentQuestion.type === 'mc'`, render `<QuestionMC>` with the question, current `usedHintThisQuestion`, and an `onAnswer` callback wired to `helpers.answerQuestion`
   - When `currentQuestion.type === 'order'` or `'select'`, render a placeholder `<div>` with text like "Speed round coming soon" — these are wired up in Stories 2.4 and 2.6+
   - QuestionMC gets `key={state.roundIndex}` so it fully unmounts/remounts between rounds (resets `selectedIndex` per Story 1.13's contract)

5. **Hint wiring:**
   - HintButton's `onUse` = `helpers.useHint`
   - HintButton's `disabled` = `state.usedHintThisQuestion`
   - HintButton is mounted only during MC question phase (not during feedback, not during speed rounds — even though speed rounds will skip the hint per FR26 once wired)

6. **Feedback rendering:**
   - When `phase === 'feedback'`, render `<FeedbackOverlay>` with:
     - `isCorrect` from `state.lastFeedback.isCorrect`
     - `pool` from `state.lastFeedback.pool`
     - `message` — selected ONCE per round when phase transitions to feedback, via `pickMessage(POOLS[pool], rng)` (see Dev Notes for the `useMemo` pattern)
     - `pointsAwarded` — computed via `computePoints(isCorrect, state.usedHintThisQuestion)` from Story 1.6's scoring module
     - `isLastRound` — `state.roundIndex === state.questions.length - 1`
     - `onAdvance` — `isLastRound ? helpers.finishGame : helpers.advanceToNext`
   - FeedbackOverlay gets `key={`feedback-${state.roundIndex}`}` so it remounts cleanly per round (re-triggers the 400ms button-reveal timer)

7. **Pool JSONs imported + Zod-validated at module scope:**
   - Imports all 6 per-answer pools: `right-no-streak`, `wrong-no-streak`, `on-fire`, `streak-broken`, `comeback`, `doing-bad`
   - `MessagePoolSchema.parse(...)` at module scope; validation failures throw → caught by the existing `<ErrorBoundary>` (Story 1.9)
   - Stored in a `POOLS: Record<MessagePoolId, string[]>` lookup

8. **Defensive guards:**
   - If `state.phase` is not `'question'` or `'feedback'` → return null (caller mounts GameScreen only when the game is active)
   - If `state.questions[state.roundIndex]` is undefined → return null

9. **`GameScreen.test.tsx` covers (per AC #4 in the epic — "transitioning from question state to feedback state and back to a new question"):**
   - Mount with seeded fixture questions in question phase → shows QuestionMC, ScoreDisplay, HintButton, and the progress text
   - Does NOT render FeedbackOverlay in question phase
   - After tapping an answer (transitions to feedback phase) → shows FeedbackOverlay, hides QuestionMC + HintButton
   - Tapping Next in FeedbackOverlay (`revealDelayMs={0}` via injected fake-timer fast-forward or by patching the overlay's default... actually we use `vi.useFakeTimers()` + advance 400ms in tests) → moves to next round, shows next question
   - Progress text reflects round index: "Q 1/X" then "Q 2/X" after advance
   - Score updates correctly after a correct answer
   - Hint button: tapping → calls helpers.useHint; QuestionMC reflects greyed quadrant

10. **Build + tests pass + bundle actually grows:**
    - `npm test` exit 0 (163 prior + 7+ new)
    - `npm run build` clean
    - **Bundle GROWS** for the first time — GameScreen imports the 6 message pool JSONs (~few kB) plus pulls Motion's `animate()` (via ScoreDisplay) and the FeedbackOverlay into the production graph. Note the new size in completion notes.

## Tasks / Subtasks

- [x] **Task 1: Pre-work safety check**
  - [x] Working tree clean; on `main`; up to date
  - [x] Verify Story 1.14 in place: `src/components/game/FeedbackOverlay.tsx`; 163 tests pass
  - [x] Create branch `story/1-15-game-screen`

- [x] **Task 2: Implement `src/components/game/GameScreen.tsx`**
  - [x] File per Dev Notes — module-scope pool imports, `useMemo` for feedback message, conditional renders gated by `state.phase`
  - [x] Type-check clean

- [x] **Task 3: Implement `src/components/game/GameScreen.module.css`**
  - [x] Header (flex row, space-between), body (centered with padding), footer (centered HintButton)
  - [x] All values via tokens

- [x] **Task 4: Implement `src/components/game/GameScreen.test.tsx`**
  - [x] Helper `renderGameScreen(fixtureQuestions, opts)` that wraps in `<GameProvider>`, dispatches START_GAME, returns the helpers + DOM
  - [x] 7+ tests covering the round flow + helpers + display
  - [x] Use `vi.useFakeTimers()` for the FeedbackOverlay button reveal
  - [x] All pass

- [x] **Task 5: Full test + build verification**
  - [x] `npm test` all green
  - [x] `npm run build` clean — note the new bundle size (will grow)

- [x] **Task 6: Commit + push to main**
  - [x] Two commits (src + spec)
  - [x] Fast-forward main, push, delete branch

## Dev Notes

### Why GameScreen Picks the Feedback Message (Instead of FeedbackOverlay)

FeedbackOverlay (Story 1.14) was intentionally kept presentational — no JSON imports, takes the pre-selected message as a prop. The reason: messages should be picked ONCE per round transition, not on every render. Owning that decision at the orchestrator level keeps:

- FeedbackOverlay tests trivial (no JSON, no rng)
- The `useMemo([roundIndex, phase])` pattern in one place
- The rng injection localized to one component (GameScreen)

### `useMemo` Pattern for Feedback Message

```typescript
const feedbackMessage = useMemo<string>(() => {
  if (state.phase !== 'feedback' || !state.lastFeedback) return '';
  const pool = POOLS[state.lastFeedback.pool];
  if (!pool || pool.length === 0) return '';
  return pickMessage(pool, rng);
  // rng intentionally NOT in deps — re-renders shouldn't re-pick a message
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [state.phase, state.roundIndex, state.lastFeedback]);
```

The `roundIndex` dep is what gives a new message per round (since `lastFeedback` may update inside the same round when answer changes streak math, but `roundIndex` is the round-stable identifier).

### Exact `src/components/game/GameScreen.tsx`

```typescript
import { useMemo } from 'react';
import { useGameState } from '../../state/useGameState';
import { computePoints } from '../../lib/scoring';
import { pickMessage } from '../../lib/picker';
import { defaultRng, type Rng } from '../../lib/rng';
import { MessagePoolSchema, type MessagePoolId } from '../../lib/schemas/message.schema';
import { uiStrings } from '../../content/uiStrings';
import { ScoreDisplay } from './ScoreDisplay';
import { QuestionMC } from './QuestionMC';
import { HintButton } from './HintButton';
import { FeedbackOverlay } from './FeedbackOverlay';
import styles from './GameScreen.module.css';

// Pool imports — validated at module scope; failures throw → ErrorBoundary.
import rightNoStreakJson from '../../../data/messages/right-no-streak.json';
import wrongNoStreakJson from '../../../data/messages/wrong-no-streak.json';
import onFireJson from '../../../data/messages/on-fire.json';
import doingBadJson from '../../../data/messages/doing-bad.json';
import streakBrokenJson from '../../../data/messages/streak-broken.json';
import comebackJson from '../../../data/messages/comeback.json';

const POOLS: Partial<Record<MessagePoolId, string[]>> = {
  'right-no-streak': MessagePoolSchema.parse(rightNoStreakJson),
  'wrong-no-streak': MessagePoolSchema.parse(wrongNoStreakJson),
  'on-fire':         MessagePoolSchema.parse(onFireJson),
  'doing-bad':       MessagePoolSchema.parse(doingBadJson),
  'streak-broken':   MessagePoolSchema.parse(streakBrokenJson),
  'comeback':        MessagePoolSchema.parse(comebackJson),
};

export type GameScreenProps = {
  /** Override randomness — used by tests. Defaults to Math.random(). */
  rng?: Rng;
};

export function GameScreen({ rng = defaultRng }: GameScreenProps = {}) {
  const { state, helpers } = useGameState();

  const feedbackMessage = useMemo<string>(() => {
    if (state.phase !== 'feedback' || !state.lastFeedback) return '';
    const pool = POOLS[state.lastFeedback.pool];
    if (!pool || pool.length === 0) return '';
    return pickMessage(pool, rng);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.roundIndex, state.lastFeedback]);

  if (state.phase !== 'question' && state.phase !== 'feedback') return null;

  const currentQuestion = state.questions[state.roundIndex];
  if (!currentQuestion) return null;

  const isLastRound = state.roundIndex === state.questions.length - 1;
  const isMC = currentQuestion.type === 'mc';

  const pointsAwarded = state.lastFeedback
    ? computePoints(state.lastFeedback.isCorrect, state.usedHintThisQuestion)
    : 0;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <span className={styles.progress}>
          {uiStrings.progress(state.roundIndex + 1, state.questions.length)}
        </span>
        <ScoreDisplay score={state.score} />
      </header>

      <main className={styles.body}>
        {state.phase === 'question' && isMC && (
          <QuestionMC
            key={state.roundIndex}
            question={currentQuestion.question}
            usedHint={state.usedHintThisQuestion}
            onAnswer={helpers.answerQuestion}
          />
        )}
        {state.phase === 'question' && !isMC && (
          <div className={styles.placeholder}>Speed round coming soon</div>
        )}
        {state.phase === 'feedback' && state.lastFeedback && (
          <FeedbackOverlay
            key={`feedback-${state.roundIndex}`}
            isCorrect={state.lastFeedback.isCorrect}
            message={feedbackMessage}
            pointsAwarded={pointsAwarded}
            pool={state.lastFeedback.pool}
            isLastRound={isLastRound}
            onAdvance={isLastRound ? helpers.finishGame : helpers.advanceToNext}
          />
        )}
      </main>

      {state.phase === 'question' && isMC && (
        <footer className={styles.footer}>
          <HintButton onUse={helpers.useHint} disabled={state.usedHintThisQuestion} />
        </footer>
      )}
    </div>
  );
}
```

### Exact `src/components/game/GameScreen.module.css`

```css
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-width: 640px;
  margin: 0 auto;
  padding: var(--space-4) var(--space-5);
  gap: var(--space-5);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding-block: var(--space-2);
}

.progress {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.footer {
  display: flex;
  justify-content: center;
  padding-block: var(--space-4);
}

.placeholder {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  color: var(--color-text-muted);
  text-align: center;
  padding: var(--space-7);
}
```

### Exact `src/components/game/GameScreen.test.tsx`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, type RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { GameProvider } from '../../state/GameProvider';
import { useGameState } from '../../state/useGameState';
import { GameScreen } from './GameScreen';
import type { GameQuestion } from '../../lib/gameReducer';
import type { MultipleChoiceQuestion } from '../../lib/schemas/question.schema';
import { uiStrings } from '../../content/uiStrings';

const mcFixture: MultipleChoiceQuestion = {
  prompt: 'Test prompt',
  options: ['Alpha', 'Bravo', 'Charlie', 'Delta'],
  correctIndex: 0,
  funnyWrongIndex: 2,
  menuRefs: [],
};

function makeMCQuestions(count: number): GameQuestion[] {
  return Array.from({ length: count }, (_, i) => ({
    type: 'mc',
    question: {
      ...mcFixture,
      prompt: `Question ${i + 1}`,
    },
  }));
}

/**
 * Helper that wraps GameScreen in a GameProvider, dispatches START_GAME with
 * fixture questions, and returns the rendered output. The Starter component
 * lives inside the Provider so it can call useGameState() to dispatch.
 */
function setupGameScreen(questions: GameQuestion[]): RenderResult {
  function Starter({ children }: { children: ReactNode }) {
    const { state, helpers } = useGameState();
    // Bootstrap on mount.
    if (state.phase === 'start') {
      // Calling dispatch during render is a no-op for state.phase change in
      // this synchronous test setup; for cleanliness we use useEffect.
    }
    return <>{children}</>;
  }

  function StartGameOnMount() {
    const { state, helpers } = useGameState();
    // useEffect-free bootstrap: only start once.
    if (state.phase === 'start' && state.questions.length === 0) {
      helpers.startGame(questions);
    }
    return null;
  }

  return render(
    <GameProvider>
      <StartGameOnMount />
      <GameScreen rng={() => 0} />
    </GameProvider>,
  );
}

describe('GameScreen', () => {
  describe('question phase', () => {
    it('renders the current question, score, hint button, and progress text', () => {
      setupGameScreen(makeMCQuestions(3));
      expect(screen.getByText('Question 1')).toBeTruthy();
      expect(screen.getByText('Score:')).toBeTruthy();
      expect(screen.getByText(uiStrings.progress(1, 3))).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Hint' })).toBeTruthy();
    });

    it('does not render the feedback overlay', () => {
      setupGameScreen(makeMCQuestions(3));
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });

  describe('transition to feedback phase', () => {
    it('renders the feedback overlay and hides the question + hint button after answer', async () => {
      setupGameScreen(makeMCQuestions(3));
      await userEvent.click(screen.getByRole('button', { name: 'Alpha' }));
      expect(screen.getByRole('alert')).toBeTruthy();
      expect(screen.queryByText('Question 1')).toBeNull();
      expect(screen.queryByRole('button', { name: 'Hint' })).toBeNull();
    });

    it('feedback overlay shows the correct verdict for a correct answer', async () => {
      setupGameScreen(makeMCQuestions(3));
      await userEvent.click(screen.getByRole('button', { name: 'Alpha' })); // correctIndex=0
      expect(screen.getByText('✓')).toBeTruthy();
      expect(screen.getByText('+5')).toBeTruthy();
    });

    it('feedback overlay shows wrong verdict + 0 points for a wrong answer', async () => {
      setupGameScreen(makeMCQuestions(3));
      await userEvent.click(screen.getByRole('button', { name: 'Bravo' }));
      expect(screen.getByText('✗')).toBeTruthy();
      expect(screen.getByText('+0')).toBeTruthy();
    });
  });

  describe('advancing to the next round', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('Tapping NEXT advances to the next question, updates the progress text, and re-renders QuestionMC', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      setupGameScreen(makeMCQuestions(3));

      await user.click(screen.getByRole('button', { name: 'Alpha' }));
      // FeedbackOverlay button is hidden for 400ms — advance fake timer.
      act(() => {
        vi.advanceTimersByTime(400);
      });

      await user.click(screen.getByRole('button', { name: uiStrings.buttons.next }));

      expect(screen.getByText('Question 2')).toBeTruthy();
      expect(screen.getByText(uiStrings.progress(2, 3))).toBeTruthy();
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });

  describe('hint flow', () => {
    it('tapping HintButton greys a wrong quadrant in QuestionMC', async () => {
      const { container } = setupGameScreen(makeMCQuestions(3));
      await userEvent.click(screen.getByRole('button', { name: 'Hint' }));

      // After useHint, exactly one wrong distractor (index 1 or 3 — not 0 correct, not 2 funny) is greyed.
      const greyed = container.querySelector('[data-quadrant-state="greyed"]');
      expect(greyed).toBeTruthy();
      const idx = greyed?.getAttribute('data-quadrant-index');
      expect(['1', '3']).toContain(idx);
    });
  });
});
```

### Common LLM Mistakes to Avoid

- **Do NOT** call `pickMessage` outside `useMemo` — re-renders would re-pick the displayed message on every state change
- **Do NOT** include `rng` in the `useMemo` deps — re-renders shouldn't re-pick
- **Do NOT** put hooks (`useGameState`, `useMemo`) inside conditional branches or after early returns — they must run unconditionally
- **Do NOT** mount `<GameScreen>` without a surrounding `<GameProvider>` — the `useGameState` hook will throw (by design)
- **Do NOT** test by manipulating `state` directly — use the public dispatch surface (helpers from `useGameState`) so tests exercise the real flow
- **Do NOT** hardcode `30` for the round count — use `state.questions.length`, which supports the Epic 1 milestone (15-round games) AND full 30-round games
- **Do NOT** skip the `key` props on QuestionMC and FeedbackOverlay — `key={roundIndex}` and `key={`feedback-${roundIndex}`}` are how those components reset their internal state between rounds
- **Do NOT** use `useEffect` to dispatch in tests — the `StartGameOnMount` helper does it synchronously during render via the `phase === 'start'` guard (which only fires once)
- **Do NOT** assert on CSS class names — use `data-quadrant-state`, `role="alert"`, accessible names

### Testing Standards

- Vitest + jsdom (configured)
- Helper `setupGameScreen(questions)` returns the `RenderResult` and bootstraps state via dispatch (no direct state mutation)
- `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })` integrates user-event with fake timers — needed when the user interaction triggers a `setTimeout`-driven UI change (the FeedbackOverlay button reveal)
- Stable selectors: `getByText` for prompt text, `getByRole` for buttons, `data-*` for component-internal state

### Previous Story Intelligence

**From Story 1.8 (reducer + Provider + hook):**
- `useGameState()` returns `{ state, dispatch, helpers }`
- Helpers: `startGame`, `answerQuestion`, `useHint`, `advanceToNext`, `finishGame`, `playAgain`
- `state.lastFeedback` is `{ isCorrect, pool } | null` (set after ANSWER_QUESTION, cleared on ADVANCE_TO_NEXT)
- `state.usedHintThisQuestion` is true after USE_HINT, reset on ADVANCE_TO_NEXT

**From Story 1.6 (scoring + picker):**
- `computePoints(isCorrect, usedHint)` returns 5/2/0
- `pickMessage(pool, rng)` throws on empty pool

**From Story 1.9 (vitest setup):**
- `afterEach(cleanup)` in `vitest.setup.ts` handles RTL unmounts

**From Story 1.13 (QuestionMC):**
- Component uses `key={roundIndex}` to reset state between rounds — caller (GameScreen) provides this

**From Story 1.14 (FeedbackOverlay):**
- 400ms button reveal delay; tests need `vi.useFakeTimers()` + `advanceTimersByTime(400)`
- `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })` is the canonical integration pattern for user-event v14 + fake timers

### Git Intelligence

Last 4 commits on main:

```
83ab45f Add Story 1.14 dev spec to planning artifacts
07ce70b Story 1.14: FeedbackOverlay — Beat 2 verdict with 6 pool variants
4dd896a Add Story 1.13 dev spec to planning artifacts
af50231 Story 1.13: QuestionMC — 4-quadrant MC with lock, reveal, and hint greying
```

Story 1.15 builds on `83ab45f`.

### Latest Tech Information

- **`@testing-library/user-event` 14.6.1** — `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })` is the documented integration for fake timers
- No new dependencies

### Project Structure Notes

**Alignment with architecture:**
- `src/components/game/GameScreen.tsx` + `.module.css` + `.test.tsx` ✓ (architecture lines 375–377)
- First consumer of `useGameState` — matches the "Provider ↔ Components boundary" (line 470)
- Owns message-selection logic per FR38 ownership chain (reducer picks pool, component picks message string)

### References

- **Story source:** `_bmad-output/planning-artifacts/epics.md` § "Epic 1, Story 1.15"
- **PRD FRs:** FR1–FR7 (game loop), FR8–FR11 (MC mechanics), FR25–FR29 (hint), FR30–FR35 (scoring), FR36–FR41 (personality messages)
- **Architecture:** §"Frontend Architecture", §"Architectural Boundaries" (Provider ↔ Components line 470), §"Data Flow" line 515
- **UX:** §"Implementation Approach" line 401 — MC layout, §"Flow Optimization Principles" line 479 — "Q 5/30" header
- **Previous stories:** 1-3 (MessagePoolId), 1-6 (scoring + picker), 1-8 (Provider + hook), 1-11 (ScoreDisplay), 1-12 (HintButton), 1-13 (QuestionMC), 1-14 (FeedbackOverlay)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code)

### Debug Log References

**Tapping NEXT test hung at 5s timeout under fake timers + user-event v14:**
- Original approach used `vi.useFakeTimers()` + `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })` + `vi.advanceTimersByTime(400)` to fire the FeedbackOverlay's reveal timer.
- Result: the `await user.click(nextBtn)` call never resolved (microtask scheduling under fake timers + the async user-event v14 internals interact poorly even with the `advanceTimers` config).
- Fix: dropped fake timers for that test entirely. Used real timers + `await screen.findByRole('button', { name: 'NEXT →' })` which polls for up to 1s — covers the 400ms delay without timer manipulation. Cleaner and more representative of the real flow.
- Lesson recorded: prefer `findByRole` over fake-timer advancement when waiting on short async UI changes (<1s).

### Completion Notes List

- `src/components/game/GameScreen.tsx` — first useGameState consumer. Composes Score header + QuestionMC body + HintButton footer + FeedbackOverlay (conditional on phase).
- 6 per-answer message pools imported + Zod-validated at module scope; failures route to ErrorBoundary.
- `useMemo([phase, roundIndex, lastFeedback])` for feedback message selection — picks once per round transition; `rng` excluded from deps so re-renders don't re-pick.
- Non-MC question types render a "Speed round coming soon" placeholder (Stories 2.4 / 2.6+ replace).
- `key` props on QuestionMC and FeedbackOverlay reset their internal state per round.
- 7 tests pass: question phase (2), feedback transition (3), advancing to next round (1), hint flow (1).
- **Test count: 170** (was 163 → +7).
- **Bundle: 194.36 kB / gzip 61.24 kB — STILL unchanged.** GameScreen isn't imported by `App.tsx` yet, so Vite tree-shakes the whole subtree (including the 6 pool JSONs, Motion's animate, every game-screen component). The real bundle growth lands when Story 1.16/1.17 wires App composition.

### File List

- **NEW** `src/components/game/GameScreen.tsx`
- **NEW** `src/components/game/GameScreen.module.css`
- **NEW** `src/components/game/GameScreen.test.tsx`

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-23 | Story created. First useGameState consumer; composes Epic 1's game-screen components. Owns message selection via useMemo([phase, roundIndex, lastFeedback]). Module-scope pool imports + Zod parse so validation failures route to ErrorBoundary. | bmad-create-story (Claude Opus 4.7) |
| 2026-05-23 | Story implemented and shipped. 170 tests pass (163 prior + 7 new). One test required dropping fake timers (used findByRole instead — polls past the 400ms FeedbackOverlay reveal). Bundle still unchanged — tree-shaken until App.tsx composition lands in Story 1.16/1.17. | bmad-dev-story (Claude Opus 4.7) |
