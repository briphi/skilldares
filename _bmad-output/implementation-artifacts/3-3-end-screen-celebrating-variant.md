# Story 3.3: End Screen Celebrating Variant

Status: ready-for-review

## Story

As a player,
I want the End screen to look distinctly different when I beat my high score,
so that the achievement is unmistakable.

## ⚠️ Includes a small refactor of `useEndOfGameHighScorePersist` (Story 1.17)

The current hook is a `useEffect` side-effect-only that writes the new score to storage. The celebrating variant decision needs to know if `finalScore > previousPersonalBest` — where "previous" means the PB BEFORE this game's score was persisted. If we just read `highScore` from `useHighScore` at End-screen-render time, the persist effect would already have updated it, so the comparison would always be false.

Fix: extend `useEndOfGameHighScorePersist` to **snapshot** the pre-update PB and return it. App passes the snapshot to EndScreen as `previousPersonalBest`. EndScreen derives `isNewHighScore` internally.

## Acceptance Criteria

1. **`src/state/useEndOfGameHighScorePersist.ts` extended:**
   - Return type changes from `void` to `{ previousHighScore: number | null }`
   - Captures the `highScore` value at the moment phase becomes `'end'` (before calling `updateHighScore`)
   - Resets the snapshot to `null` when phase transitions away from `'end'` (so the next game's End screen gets a fresh snapshot)
   - Existing behavior preserved: writes the new score iff `score > highScore` (or `highScore === null`)
   - Tests updated to cover the new return shape

2. **`src/components/end/EndScreen.tsx` extended with celebrating variant:**
   - New prop: `previousPersonalBest: number | null` — drives the variant decision
   - New prop: `celebratoryMessages?: string[]` — defaults to the `new-high-score` pool (loaded + Zod-parsed at module scope)
   - Existing prop renamed for clarity: `messages` → `standardMessages` (default still `right-no-streak`)
   - Internal logic:
     - `isNewHighScore = finalScore > (previousPersonalBest ?? -1)` (covers no-prior-PB case → first game always celebrates)
     - If celebrating: render the celebrating variant
     - Else: render the standard variant (Story 1.16, unchanged behavior)
   - Both variants pick their message once on mount via `useState(() => pickMessage(...))` — re-renders don't re-pick

3. **Celebrating variant layout (per epic AC):**
   - `<Confetti />` overlay (Story 3.2) at the top of the container
   - Header: `"🎉 NEW HIGH SCORE! 🎉"` in accent color (`--color-brand-accent`), display font, `--text-2xl`
   - Final score in accent color (instead of standard gold), display font, `--text-3xl` (largest element)
   - `"Was: {previousPersonalBest}"` line beneath, muted styling — **hidden when `previousPersonalBest === null`** (first-game case)
   - One random message from `celebratoryMessages` pool (display font, `--text-xl`)
   - `RUN IT BACK` button (primary variant, unchanged)
   - All wrapped in a container with `position: relative` so the Confetti overlay positions correctly

4. **Standard variant unchanged:**
   - Story 1.16's layout intact (FINAL DAMAGE label, score in gold, ALL-TIME BEST line, message, RUN IT BACK)
   - Still picks message from `standardMessages` pool (right-no-streak default)

5. **`src/App.tsx` updated:**
   - Capture `previousHighScore` from the extended hook return
   - Pass `previousPersonalBest={previousHighScore}` to `<EndScreen>`
   - No new content imports needed in App (EndScreen owns the new-high-score pool import)

6. **`EndScreen.test.tsx` extended with celebrating-variant tests:**
   - When `previousPersonalBest === null` (first game): celebrating variant renders (confetti present, "🎉 NEW HIGH SCORE!" header, score in accent-color treatment)
   - When `finalScore > previousPersonalBest`: celebrating variant renders + "Was: {prev}" line visible
   - When `finalScore === previousPersonalBest`: STANDARD variant (no tie-break ceremony)
   - When `finalScore < previousPersonalBest`: standard variant
   - Celebrating variant uses messages from `celebratoryMessages` prop (deterministic with injected rng)
   - "Was:" line hidden when `previousPersonalBest === null`
   - Confetti element absent from standard variant DOM

7. **`useEndOfGameHighScorePersist.test.ts` updated:**
   - Existing 7 tests still pass
   - New tests for the snapshot return: 
     - First game (highScore=null) → snapshot is null
     - PB game (highScore=80, score=100) → snapshot is 80
     - Non-PB game (highScore=80, score=50) → snapshot is 80
     - Resets when phase transitions away from 'end' (to 'start' for Play Again)

8. **Build + tests pass:**
   - `npm test` exit 0 (273 prior + new)
   - `npm run build` clean
   - Bundle grows for the new-high-score JSON + Confetti runtime entering production graph (~3-5 kB gzip estimate)

## Tasks / Subtasks

- [x] **Task 1: Pre-work safety check**
  - [x] Working tree clean; on `main`; up to date
  - [x] Confirm 273 tests pass
  - [x] Create branch `story/3-3-end-screen-celebrating`

- [x] **Task 2: Extend `src/state/useEndOfGameHighScorePersist.ts`**
  - [x] Add snapshot state for `previousHighScore`
  - [x] Capture in the end-phase effect BEFORE calling `updateHighScore`
  - [x] Reset to null when phase transitions away from 'end'
  - [x] Return `{ previousHighScore }`

- [x] **Task 3: Update `useEndOfGameHighScorePersist.test.ts`**
  - [x] Existing tests should still pass (the new return value doesn't break them — they just don't check it)
  - [x] Add 4 new tests covering snapshot behavior

- [x] **Task 4: Extend `src/components/end/EndScreen.tsx`**
  - [x] Add module-scope import + Zod parse for `new-high-score.json`
  - [x] Rename `messages` prop → `standardMessages`; add `celebratoryMessages?`, `previousPersonalBest`
  - [x] Add isNewHighScore derivation
  - [x] Branch render between standard and celebrating variants
  - [x] Use `<Confetti />` overlay in celebrating variant

- [x] **Task 5: Extend `src/components/end/EndScreen.module.css`**
  - [x] Add celebrating-variant classes (header, score-accent, was-line, container with position:relative for Confetti overlay)

- [x] **Task 6: Update `src/App.tsx`**
  - [x] Capture `previousHighScore` from the hook return
  - [x] Thread to EndScreen via `previousPersonalBest` prop

- [x] **Task 7: Update `EndScreen.test.tsx`**
  - [x] Update existing tests if they use the renamed `messages` prop → `standardMessages`
  - [x] Add 6+ celebrating-variant tests per AC #6

- [x] **Task 8: Full test + build**
  - [x] `npm test` all green
  - [x] `npm run build` clean
  - [x] Note bundle growth

- [x] **Task 9: Commit + push to main**
  - [x] Two commits (impl + spec)
  - [x] Fast-forward main, push, delete branch

## Dev Notes

### Why the PB Snapshot Is in the Hook (Not in App or EndScreen)

Three pieces of state matter at end-of-game:
- **`previousPersonalBest`** — the PB BEFORE this game (what to compare against, what to show in "Was:")
- **`finalScore`** — this game's score
- **`personalBest` (current)** — the stored value (post-update if score > prev)

If App snapshots in a local `useState`, it has to coordinate with the persist effect's timing. If EndScreen snapshots, it has to handle the "highScore loaded async" race from Story 1.16's design.

Cleanest: the hook that OWNS the side effect also owns the snapshot. Both happen in the same `useEffect` tick, so the comparison is consistent. Hook returns the snapshot for any consumer who needs it. App threads to EndScreen.

### Exact `useEndOfGameHighScorePersist.ts` Update

```typescript
import { useEffect, useState } from 'react';
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

export function useEndOfGameHighScorePersist(
  phase: GamePhase,
  score: number,
  highScore: number | null,
  updateHighScore: (score: number) => void,
): UseEndOfGameHighScorePersistResult {
  const [previousHighScore, setPreviousHighScore] = useState<number | null>(null);

  useEffect(() => {
    if (phase !== 'end') {
      // Reset snapshot when leaving end phase (next game's End screen gets a fresh capture).
      setPreviousHighScore(null);
      return;
    }
    // Capture snapshot BEFORE updating storage.
    setPreviousHighScore(highScore);
    if (highScore === null || score > highScore) {
      updateHighScore(score);
    }
  }, [phase, score, highScore, updateHighScore]);

  return { previousHighScore };
}
```

Note: the snapshot is set inside the same effect that writes the new score. Because `setPreviousHighScore` runs before `updateHighScore`, the snapshot captures the pre-update value. The next render reads both correctly.

Subtle: this effect runs whenever any of `[phase, score, highScore, updateHighScore]` change. When `updateHighScore` writes a new value, `highScore` changes → effect re-runs → captures the NEW highScore as the snapshot. That'd overwrite the correct pre-update snapshot.

To prevent: guard with a "have we captured for this phase entry?" flag:

```typescript
const capturedRef = useRef<boolean>(false);

useEffect(() => {
  if (phase !== 'end') {
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
```

`capturedRef` ensures the capture + write happen exactly once per end-phase entry, even if highScore updates as a result of `updateHighScore`.

### Exact `EndScreen.tsx` Update (Key Changes)

```typescript
import { useState } from 'react';
import { Button } from '../shared/Button';
import { Confetti } from '../shared/Confetti';
import { uiStrings } from '../../content/uiStrings';
import { pickMessage } from '../../lib/picker';
import { defaultRng, type Rng } from '../../lib/rng';
import { MessagePoolSchema } from '../../lib/schemas/message.schema';
import rawStandardPool from '../../../data/messages/right-no-streak.json';
import rawCelebratoryPool from '../../../data/messages/new-high-score.json';
import styles from './EndScreen.module.css';

const defaultStandardPool = MessagePoolSchema.parse(rawStandardPool);
const defaultCelebratoryPool = MessagePoolSchema.parse(rawCelebratoryPool);

export type EndScreenProps = {
  finalScore: number;
  personalBest: number | null;
  /** PB at game start (pre-update). Drives the celebrating-variant decision. */
  previousPersonalBest: number | null;
  onPlayAgain: () => void;
  /** Override standard-variant pool — used by tests. */
  standardMessages?: string[];
  /** Override celebrating-variant pool — used by tests. */
  celebratoryMessages?: string[];
  rng?: Rng;
};

export function EndScreen({
  finalScore,
  personalBest,
  previousPersonalBest,
  onPlayAgain,
  standardMessages = defaultStandardPool,
  celebratoryMessages = defaultCelebratoryPool,
  rng = defaultRng,
}: EndScreenProps) {
  const isNewHighScore = finalScore > (previousPersonalBest ?? -1);
  const messages = isNewHighScore ? celebratoryMessages : standardMessages;
  const [message] = useState<string>(() => pickMessage(messages, rng));

  if (isNewHighScore) {
    return (
      <div className={`${styles.container} ${styles.celebrating}`}>
        <Confetti />
        <p className={styles.celebrateHeader}>🎉 NEW HIGH SCORE! 🎉</p>
        <p className={`${styles.score} ${styles.scoreAccent}`}>{finalScore}</p>
        {previousPersonalBest !== null && (
          <p className={styles.wasLine}>Was: {previousPersonalBest}</p>
        )}
        <p className={styles.message}>{message}</p>
        <Button variant="primary" onClick={onPlayAgain}>
          {uiStrings.buttons.playAgain}
        </Button>
      </div>
    );
  }

  // Standard variant (Story 1.16 unchanged)
  const pbDisplay = personalBest === null ? uiStrings.endScreen.noPbValue : String(personalBest);
  return (
    <div className={styles.container}>
      <p className={styles.scoreLabel}>{uiStrings.endScreen.finalScoreLabel}</p>
      <p className={styles.score}>{finalScore}</p>
      <p className={styles.pbLine}>
        <span className={styles.pbLabel}>{uiStrings.endScreen.personalBestLabel}:</span>{' '}
        <span className={styles.pbValue}>{pbDisplay}</span>
      </p>
      <p className={styles.message}>{message}</p>
      <Button variant="primary" onClick={onPlayAgain}>
        {uiStrings.buttons.playAgain}
      </Button>
    </div>
  );
}
```

### CSS Additions

```css
.celebrating {
  position: relative;  /* anchor for Confetti overlay */
}

.celebrateHeader {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-black);
  color: var(--color-brand-accent);
  margin: 0;
  text-align: center;
  letter-spacing: 0.04em;
}

.scoreAccent {
  color: var(--color-brand-accent);
}

.wasLine {
  font-family: var(--font-body);
  font-size: var(--text-md);
  color: var(--color-text-muted);
  margin: 0;
  font-variant-numeric: tabular-nums;
}
```

### App.tsx Update

Simply destructure the hook return and pass through:

```typescript
const { previousHighScore } = useEndOfGameHighScorePersist(
  state.phase, state.score, highScore, updateHighScore,
);

// In the end-phase render:
<EndScreen
  finalScore={state.score}
  personalBest={highScore}
  previousPersonalBest={previousHighScore}
  onPlayAgain={handlePlayAgain}
/>
```

### Test Plan (EndScreen.test.tsx Additions)

```typescript
describe('celebrating variant (new high score)', () => {
  const celebFixtureMessages = ['Celebrate A', 'Celebrate B'];

  it('renders celebrating variant when finalScore > previousPersonalBest', () => {
    const { container } = render(
      <EndScreen
        finalScore={100}
        personalBest={100}
        previousPersonalBest={80}
        onPlayAgain={() => {}}
        celebratoryMessages={celebFixtureMessages}
        rng={() => 0}
      />,
    );
    expect(screen.getByText('🎉 NEW HIGH SCORE! 🎉')).toBeTruthy();
    expect(screen.getByText('Was: 80')).toBeTruthy();
    expect(container.querySelector('[data-confetti-mode]')).toBeTruthy();
  });

  it('renders celebrating variant when previousPersonalBest is null (first game)', () => {
    const { container } = render(
      <EndScreen
        finalScore={50}
        personalBest={50}
        previousPersonalBest={null}
        onPlayAgain={() => {}}
        celebratoryMessages={celebFixtureMessages}
        rng={() => 0}
      />,
    );
    expect(screen.getByText('🎉 NEW HIGH SCORE! 🎉')).toBeTruthy();
    // "Was:" line hidden when previousPersonalBest is null
    expect(screen.queryByText(/Was:/)).toBeNull();
  });

  it('renders STANDARD variant when finalScore equals previousPersonalBest (no tie ceremony)', () => {
    render(
      <EndScreen
        finalScore={80}
        personalBest={80}
        previousPersonalBest={80}
        onPlayAgain={() => {}}
        standardMessages={['standard']}
        celebratoryMessages={['celebrate']}
        rng={() => 0}
      />,
    );
    expect(screen.queryByText('🎉 NEW HIGH SCORE! 🎉')).toBeNull();
    expect(screen.getByText(uiStrings.endScreen.finalScoreLabel)).toBeTruthy();
  });

  it('renders STANDARD variant when finalScore < previousPersonalBest', () => {
    render(
      <EndScreen
        finalScore={50}
        personalBest={80}
        previousPersonalBest={80}
        onPlayAgain={() => {}}
        standardMessages={['standard']}
        celebratoryMessages={['celebrate']}
        rng={() => 0}
      />,
    );
    expect(screen.queryByText('🎉 NEW HIGH SCORE! 🎉')).toBeNull();
  });

  it('celebrating variant uses celebratoryMessages pool (not standardMessages)', () => {
    render(
      <EndScreen
        finalScore={100}
        personalBest={100}
        previousPersonalBest={80}
        onPlayAgain={() => {}}
        standardMessages={['STANDARD-MSG']}
        celebratoryMessages={['CELEBRATE-MSG']}
        rng={() => 0}
      />,
    );
    expect(screen.getByText('CELEBRATE-MSG')).toBeTruthy();
    expect(screen.queryByText('STANDARD-MSG')).toBeNull();
  });

  it('Confetti is absent from standard variant', () => {
    const { container } = render(
      <EndScreen
        finalScore={50}
        personalBest={80}
        previousPersonalBest={80}
        onPlayAgain={() => {}}
        standardMessages={['standard']}
        celebratoryMessages={['celebrate']}
        rng={() => 0}
      />,
    );
    expect(container.querySelector('[data-confetti-mode]')).toBeNull();
  });

  it('clicking RUN IT BACK still works in celebrating variant', async () => {
    const onPlayAgain = vi.fn();
    render(
      <EndScreen
        finalScore={100}
        personalBest={100}
        previousPersonalBest={80}
        onPlayAgain={onPlayAgain}
        celebratoryMessages={celebFixtureMessages}
        rng={() => 0}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: uiStrings.buttons.playAgain }));
    expect(onPlayAgain).toHaveBeenCalledOnce();
  });
});
```

Plus update the existing tests that used `messages={fixtureMessages}` → `standardMessages={fixtureMessages}` AND add `previousPersonalBest` to each existing test's prop list (use `previousPersonalBest={50}` for tests that don't want celebration to fire, where `finalScore` is also 42-or-less).

### Common LLM Mistakes to Avoid

- **Do NOT** put the snapshot in EndScreen — it'd re-snapshot on every prop change, defeating the purpose
- **Do NOT** forget the `capturedRef.current` guard in the hook — without it, the snapshot gets overwritten when `updateHighScore` triggers a re-render
- **Do NOT** show "Was: —" or "Was: 0" when there's no prior PB — hide the line entirely when `previousPersonalBest === null`
- **Do NOT** show the standard "FINAL DAMAGE / ALL-TIME BEST" labels in celebrating variant — celebrating has its own header ("🎉 NEW HIGH SCORE! 🎉") and "Was:" line; the standard labels are for the standard variant only
- **Do NOT** use the SAME message pool default for both variants — `right-no-streak` for standard, `new-high-score` for celebrating
- **Do NOT** forget to position the celebrating container as `position: relative` — Confetti uses `position: absolute; inset: 0` and needs a positioned ancestor

### Test Pattern Notes

- Existing EndScreen tests need a `previousPersonalBest` prop added. The simplest fix: pass `previousPersonalBest={50}` (or whatever ≥ finalScore) to all existing tests so they hit the standard variant.
- The `messages` prop is renamed to `standardMessages`. Existing tests that pass `messages={[...]}` need updating.
- Celebrating variant tests should pass BOTH `standardMessages` and `celebratoryMessages` to avoid loading the real JSON pools in test rendering (the defaults would still work but are wasteful).

### Previous Story Intelligence

**From Story 1.16 (EndScreen standard variant):**
- Existing layout + standard-variant rendering
- `useState(() => pickMessage(...))` for one-time message pick on mount
- Prop API: `finalScore`, `personalBest`, `onPlayAgain`, `messages`, `rng`

**From Story 1.17 (useEndOfGameHighScorePersist):**
- Hook current behavior: writes new score iff `score > highScore` or `highScore === null`
- Decoupled-via-hook design: App owns the orchestration

**From Story 3.1 (new-high-score pool):**
- 22 messages in `data/messages/new-high-score.json`
- Voice-celebratory

**From Story 3.2 (Confetti):**
- `<Confetti />` is the import; renders 40 particles by default, `aria-hidden`, `pointer-events: none`
- `data-confetti-mode="full|reduced"` attribute for test selectors

### Git Intelligence

Last 4 commits on main:

```
a4338b5 Update Story 3.2 spec: mark review + fill Dev Agent Record
7c616f7 Add Story 3.2 dev spec to planning artifacts
97c81f1 Story 3.2: Confetti motion variant + reusable Confetti component
955cc1c Add Story 3.1 dev spec to planning artifacts
```

Story 3.3 builds on `a4338b5`.

### Latest Tech Information

No new dependencies.

### Project Structure Notes

**Alignment with architecture:**
- `EndScreen.tsx` + module CSS already in `src/components/end/` per architecture
- The split into 2 message pools per variant is a natural evolution

### References

- **Story source:** `_bmad-output/planning-artifacts/epics.md` § "Epic 3, Story 3.3"
- **PRD FRs:** FR47 (celebratory message + PB update), FR8/FR46 (PB display), FR48 (Play Again)
- **Previous stories:** 1.16 (EndScreen standard), 1.17 (useEndOfGameHighScorePersist), 3.1 (new-high-score pool), 3.2 (Confetti)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7

### Debug Log References

- Build: `dist/assets/index-*.js 546.52 kB │ gzip: 159.09 kB` (+1 kB over Story 3.2 baseline — confetti + accent message pool)
- Tests: 290/290 passing (added 9 new EndScreen celebrating-variant tests + reused 6 hook snapshot tests from Story 3.2 build-up)

### Completion Notes List

- Extended `useEndOfGameHighScorePersist` to return `{ previousHighScore }` with a `capturedRef` guard that snapshots the PB on first end-phase entry and survives the re-render triggered by `updateHighScore`.
- Branched `EndScreen` on `isNewHighScore = finalScore > (previousPersonalBest ?? -1)`. First-game-ever (previousPersonalBest === null) qualifies as a new high score and hides the "Was:" line.
- Confetti is rendered inside the celebrating variant only; `.celebrating` has `position: relative` so the Confetti overlay (absolute, `inset: 0`) anchors to the EndScreen container, not the viewport.
- Renamed `messages` prop → `standardMessages` to make the new `celebratoryMessages` companion prop unambiguous. Both default to module-scope Zod-parsed pools.

### File List

- `src/state/useEndOfGameHighScorePersist.ts` (modified)
- `src/state/useEndOfGameHighScorePersist.test.ts` (modified — 6 new snapshot tests)
- `src/components/end/EndScreen.tsx` (modified — celebrating-variant branch)
- `src/components/end/EndScreen.module.css` (modified — celebrating variant classes)
- `src/components/end/EndScreen.test.tsx` (modified — 9 new celebrating tests + standard tests updated for renamed prop)
- `src/App.tsx` (modified — threads `previousHighScore` → `previousPersonalBest`)

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-24 | Story created. Extends EndScreen with celebrating variant gated by previousPersonalBest snapshot from the (extended) useEndOfGameHighScorePersist hook. Snapshot uses a capturedRef guard to avoid being overwritten when updateHighScore triggers a re-render. App threads the snapshot through. | bmad-create-story (Claude Opus 4.7) |
| 2026-05-24 | Implemented. 290/290 tests pass; build clean at 159 kB gz (+1 kB). Status → ready-for-review. | bmad-dev-story (Claude Opus 4.7) |
