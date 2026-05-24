# Story 1.16: End Screen (Standard Variant)

Status: review

## Story

As a player,
I want to see my final score and personal best at the end of a game with a clear Play Again button,
so that I know how I did and can immediately try again.

## Acceptance Criteria

1. **`src/components/end/EndScreen.tsx` exists with this contract:**
   - Props: `{ finalScore: number; personalBest: number | null; onPlayAgain: () => void; messages?: string[]; rng?: Rng }`
   - `messages` defaults to the `right-no-streak` pool (a generic acknowledgement — see Dev Notes); tests pass fixtures
   - `rng` defaults to `defaultRng`; tests pass deterministic rng
   - Decoupled from reducer AND from `useHighScore`: parent (Story 1.17 App composition) reads both and passes resolved values; parent ALSO handles the PB-write side effect via a separate `useEffect` so EndScreen stays purely presentational

2. **Layout (in vertical order):**
   - `FINAL DAMAGE` label (small, muted, uppercase)
   - The numeric final score (display font, large gold)
   - `ALL-TIME BEST: {n}` line (or `ALL-TIME BEST: —` if `personalBest === null`)
   - A personality message picked once on mount from the injected pool
   - `RUN IT BACK` button (primary variant)

3. **No celebration variant in Epic 1:**
   - Epic 1 standard render only. No confetti, no `new-high-score` pool message, no celebratory color shift.
   - Epic 3 (Story 3.1+) adds the celebration variant — this component intentionally does not branch on `finalScore > personalBest` for visual purposes.

4. **Message selection is one-time per mount:**
   - `const [message] = useState(() => pickMessage(messages, rng))` — same pattern as StartScreen (Story 1.10)
   - Re-renders do NOT re-pick

5. **Tapping RUN IT BACK invokes `onPlayAgain` exactly once:**
   - Parent wires `onPlayAgain` to `helpers.playAgain(selectGameQuestions(...))` (full wiring in Story 1.17)
   - The screen does not dispatch directly

6. **PB write logic lives in the parent (Story 1.17), NOT here:**
   - Architectural deviation from a literal reading of the epic AC ("the high score is silently updated via `useHighScore`") — see Dev Notes for the rationale
   - The behavior is identical to user; the code location is one level up so EndScreen stays presentational

7. **Styling via `EndScreen.module.css`:**
   - Full-height centered column (mobile-first)
   - All values via design tokens
   - Final-score number is the visual anchor (`--text-3xl`, `--color-brand-primary`, display font, black weight)
   - PB line is secondary (`--color-text-muted`, body font)
   - Message uses `--font-display` `--text-2xl` (smaller than feedback overlay's voice line — this is one of several lines, not the dominant element)

8. **`EndScreen.test.tsx` covers:**
   - Renders `FINAL DAMAGE` label + the numeric final score
   - Renders the `ALL-TIME BEST: 42` line when personalBest is set
   - Renders the `ALL-TIME BEST: —` line when personalBest is `null`
   - Renders a deterministic message with injected `messages` + `rng`
   - Re-renders do NOT re-pick the message (drifter-rng pattern from Story 1.10)
   - Renders the `RUN IT BACK` button label
   - Tapping `RUN IT BACK` invokes `onPlayAgain` exactly once

9. **Build + tests pass:**
   - `npm test` exit 0 (170 prior + 7 new)
   - `npm run build` clean
   - Bundle still unchanged (EndScreen also tree-shaken until App composition imports it — Story 1.17)

## Tasks / Subtasks

- [x] **Task 1: Pre-work safety check**
  - [x] Working tree clean; on `main`; up to date
  - [x] Verify Story 1.15 in place: `src/components/game/GameScreen.tsx`; 170 tests pass
  - [x] Create branch `story/1-16-end-screen`

- [x] **Task 2: Implement `src/components/end/EndScreen.tsx`**
  - [x] Create `src/components/end/` directory
  - [x] File per Dev Notes (module-scope pool import + parse, useState initializer for one-time pick, primary Button for the CTA)
  - [x] Type-check clean

- [x] **Task 3: Implement `src/components/end/EndScreen.module.css`**
  - [x] Centered column layout, design tokens throughout

- [x] **Task 4: Implement `src/components/end/EndScreen.test.tsx`**
  - [x] 7 tests per AC #8
  - [x] Tests pass

- [x] **Task 5: Full test + build verification**
  - [x] `npm test` all green
  - [x] `npm run build` clean

- [x] **Task 6: Commit + push to main**
  - [x] Two commits (src + spec)
  - [x] Fast-forward main, push, delete branch

## Dev Notes

### Why PB Write Lives in the Parent (Story 1.17), Not EndScreen

The literal epic AC says "if the current score IS greater than the stored PB, the high score is silently updated via `useHighScore`". That suggests EndScreen calls `useHighScore().updateHighScore(score)` on mount.

The cleaner placement is in the parent (App composition, Story 1.17):

```typescript
// In App composition, on the round-30 → end transition:
useEffect(() => {
  if (state.phase === 'end') {
    if (highScore === null || state.score > highScore) {
      updateHighScore(state.score);
    }
  }
}, [state.phase, state.score, highScore, updateHighScore]);
```

Reasons:

1. **`useHighScore` has a load-on-mount race.** It initializes `highScore = null` and updates via `useEffect`. If EndScreen mounts before that effect fires, it sees `null` (looks like "no PB yet") and would write any score. The App composition holds `useHighScore` for the whole session — no race.
2. **EndScreen stays presentational.** Pure props in, render out. Easy to test.
3. **Same observable behavior** for the user.

Document this in commit message and the App-composition story (1.17) acceptance criteria.

### Why `right-no-streak` as the Default Pool

The Epic 1 standard variant needs a generic acknowledgement message. The existing pools:
- `pre-game-encouragement` — wrong tense (pre-game)
- `right-no-streak`, `wrong-no-streak` — per-answer reactions
- `on-fire`, `comeback`, `streak-broken`, `doing-bad` — streak-specific
- `new-high-score` — Epic 3 only

`right-no-streak` is the most neutral-positive: a casual "you got something" tone that works for "you finished the game". The voice land of those 50 lines is close to a generic end-game tone.

Epic 3 will swap in a proper end-of-game pool (or branch on PB-beaten → new-high-score pool, PB-not-beaten → some other pool). For Epic 1, this single-pool placeholder satisfies the visible AC ("pulls a message from a generic/wrong/right-style pool to acknowledge the result").

### Exact `src/components/end/EndScreen.tsx`

```typescript
import { useState } from 'react';
import { Button } from '../shared/Button';
import { uiStrings } from '../../content/uiStrings';
import { pickMessage } from '../../lib/picker';
import { defaultRng, type Rng } from '../../lib/rng';
import { MessagePoolSchema } from '../../lib/schemas/message.schema';
import rawPool from '../../../data/messages/right-no-streak.json';
import styles from './EndScreen.module.css';

const defaultPool = MessagePoolSchema.parse(rawPool);

export type EndScreenProps = {
  finalScore: number;
  personalBest: number | null;
  onPlayAgain: () => void;
  /** Override the message pool — used by tests. Defaults to right-no-streak. */
  messages?: string[];
  /** Override randomness — used by tests. Defaults to Math.random(). */
  rng?: Rng;
};

export function EndScreen({
  finalScore,
  personalBest,
  onPlayAgain,
  messages = defaultPool,
  rng = defaultRng,
}: EndScreenProps) {
  const [message] = useState<string>(() => pickMessage(messages, rng));

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

### Exact `src/components/end/EndScreen.module.css`

```css
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space-6);
  gap: var(--space-5);
  text-align: center;
  max-width: 640px;
  margin: 0 auto;
}

.scoreLabel {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0;
}

.score {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  font-weight: var(--font-weight-black);
  color: var(--color-brand-primary);
  margin: 0;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.pbLine {
  font-family: var(--font-body);
  font-size: var(--text-md);
  color: var(--color-text-muted);
  margin: 0;
}

.pbLabel {
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: var(--font-weight-medium);
}

.pbValue {
  font-family: var(--font-display);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}

.message {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-black);
  color: var(--color-text-primary);
  line-height: 1.2;
  margin: 0;
  max-width: 480px;
}
```

### Exact `src/components/end/EndScreen.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EndScreen } from './EndScreen';
import { uiStrings } from '../../content/uiStrings';

const fixtureMessages = ['Test message A', 'Test message B', 'Test message C'];

describe('EndScreen', () => {
  it('renders the FINAL DAMAGE label and the numeric final score', () => {
    render(
      <EndScreen
        finalScore={42}
        personalBest={50}
        onPlayAgain={() => {}}
        messages={fixtureMessages}
        rng={() => 0}
      />,
    );
    expect(screen.getByText(uiStrings.endScreen.finalScoreLabel)).toBeTruthy();
    expect(screen.getByText('42')).toBeTruthy();
  });

  it('renders the ALL-TIME BEST line with the PB value when present', () => {
    render(
      <EndScreen
        finalScore={42}
        personalBest={87}
        onPlayAgain={() => {}}
        messages={fixtureMessages}
        rng={() => 0}
      />,
    );
    expect(screen.getByText(`${uiStrings.endScreen.personalBestLabel}:`)).toBeTruthy();
    expect(screen.getByText('87')).toBeTruthy();
  });

  it('renders "—" for the PB value when personalBest is null', () => {
    render(
      <EndScreen
        finalScore={42}
        personalBest={null}
        onPlayAgain={() => {}}
        messages={fixtureMessages}
        rng={() => 0}
      />,
    );
    expect(screen.getByText(uiStrings.endScreen.noPbValue)).toBeTruthy();
  });

  it('renders a deterministic message when given a fixed rng', () => {
    render(
      <EndScreen
        finalScore={42}
        personalBest={50}
        onPlayAgain={() => {}}
        messages={fixtureMessages}
        rng={() => 0}
      />,
    );
    // rng=0 → Math.floor(0 * 3) = 0 → first message
    expect(screen.getByText('Test message A')).toBeTruthy();
  });

  it('keeps the same picked message across re-renders (one-time pick)', () => {
    let call = 0;
    const drifterRng = () => {
      const v = call / fixtureMessages.length;
      call++;
      return v;
    };

    const { rerender } = render(
      <EndScreen
        finalScore={42}
        personalBest={50}
        onPlayAgain={() => {}}
        messages={fixtureMessages}
        rng={drifterRng}
      />,
    );
    const firstMessage = fixtureMessages.find((m) => screen.queryByText(m));
    expect(firstMessage).toBeTruthy();

    rerender(
      <EndScreen
        finalScore={42}
        personalBest={50}
        onPlayAgain={() => {}}
        messages={fixtureMessages}
        rng={drifterRng}
      />,
    );
    expect(screen.getByText(firstMessage!)).toBeTruthy();
  });

  it('renders the RUN IT BACK button label', () => {
    render(
      <EndScreen
        finalScore={42}
        personalBest={50}
        onPlayAgain={() => {}}
        messages={fixtureMessages}
        rng={() => 0}
      />,
    );
    expect(screen.getByRole('button', { name: uiStrings.buttons.playAgain })).toBeTruthy();
  });

  it('calls onPlayAgain exactly once when the button is tapped', async () => {
    const onPlayAgain = vi.fn();
    render(
      <EndScreen
        finalScore={42}
        personalBest={50}
        onPlayAgain={onPlayAgain}
        messages={fixtureMessages}
        rng={() => 0}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: uiStrings.buttons.playAgain }));
    expect(onPlayAgain).toHaveBeenCalledOnce();
  });
});
```

### Common LLM Mistakes to Avoid

- **Do NOT** call `useHighScore` inside EndScreen — parent (Story 1.17) owns the hook + PB update logic
- **Do NOT** branch the UI on `finalScore > personalBest` — celebration variant is Epic 3, not Epic 1
- **Do NOT** import all 6 message pools — only `right-no-streak` for the standard variant
- **Do NOT** re-pick the message on every render — use `useState(() => pickMessage(...))`
- **Do NOT** dispatch `PLAY_AGAIN` directly — `onPlayAgain` callback is the contract
- **Do NOT** show a "No PB yet" sentence — `—` is the entire treatment per UX/uiStrings convention
- **Do NOT** add a "Share my score" button or anything else not in the AC — Epic 1 minimal end screen
- **Do NOT** hardcode `'right-no-streak'` strings in component body — the pool import already resolves to a `string[]`

### Testing Standards

- Vitest + jsdom (configured)
- `render` + `screen` + `userEvent`
- Inline fixture `messages` prop — never imports JSON in tests
- Drifter-rng pattern verifies mount-once message selection

### Previous Story Intelligence

**From Story 1.10 (StartScreen):**
- `useState(() => pickMessage(...))` for one-time random pick on mount
- Drifter-rng pattern in tests proves mount-once behavior
- Pool import + Zod parse at module scope (failures → ErrorBoundary)

**From Story 1.9 (Button + uiStrings):**
- `uiStrings.endScreen.finalScoreLabel` = `'FINAL DAMAGE'`
- `uiStrings.endScreen.personalBestLabel` = `'ALL-TIME BEST'`
- `uiStrings.endScreen.noPbValue` = `'—'`
- `uiStrings.buttons.playAgain` = `'RUN IT BACK'`

**From Story 1.7 (useHighScore):**
- Hook returns `{ highScore, updateHighScore, hasStorage }`
- `highScore` is `number | null` (null = no PB stored, OR storage unavailable)
- Story 1.17 will wire the hook → EndScreen's `personalBest` prop

### Git Intelligence

Last 4 commits on main:

```
99851d6 Add Story 1.15 dev spec to planning artifacts
f77d6b8 Story 1.15: GameScreen orchestrator — first useGameState consumer
83ab45f Add Story 1.14 dev spec to planning artifacts
07ce70b Story 1.14: FeedbackOverlay — Beat 2 verdict with 6 pool variants
```

Story 1.16 builds on `99851d6`.

### Latest Tech Information

No new dependencies required.

### Project Structure Notes

**Alignment with architecture:**
- `src/components/end/EndScreen.tsx` ✓ (architecture file tree — first file in `src/components/end/`)
- Decoupled from reducer + useHighScore — consistent with the established pattern (StartScreen, ScoreDisplay, HintButton, QuestionMC, FeedbackOverlay all take callbacks/values via props)

### References

- **Story source:** `_bmad-output/planning-artifacts/epics.md` § "Epic 1, Story 1.16"
- **PRD FRs:** FR45 (transition to End), FR46 (display final + PB), FR47 (update PB if beaten — wired in App composition), FR48 (Play Again resets game), FR57 (storage degrades silently)
- **Architecture:** §"Requirements → File Mapping" (F9 → EndScreen)
- **UX:** §"Implementation Approach" line 405 — End screen variants (standard vs celebrating)
- **Previous stories:** 1-3 (schemas), 1-7 (useHighScore), 1-9 (Button + uiStrings), 1-10 (StartScreen patterns)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code)

### Debug Log References

None — 7/7 tests passed on first run.

### Completion Notes List

- `src/components/end/EndScreen.tsx` per spec: FINAL DAMAGE label + score number + ALL-TIME BEST line + message + RUN IT BACK button.
- Decoupled from reducer + useHighScore: takes `finalScore`, `personalBest`, `onPlayAgain` as props. Parent (Story 1.17) owns the PB-write `useEffect`.
- One-time message pick via `useState(() => pickMessage(messages, rng))` — drifter-rng test verifies re-renders don't re-pick.
- `right-no-streak` pool used as Epic 1 stand-in for end-of-game acknowledgement (Epic 3 will introduce dedicated end-game pools).
- 7 tests pass: score render, PB-present, PB-null, deterministic message, mount-once message, button label, click invokes onPlayAgain.
- **Test count: 177** (was 170 → +7).
- **Bundle: 194.36 kB / gzip 61.24 kB — unchanged.** EndScreen tree-shaken until Story 1.17's App composition imports it.

### File List

- **NEW** `src/components/end/EndScreen.tsx`
- **NEW** `src/components/end/EndScreen.module.css`
- **NEW** `src/components/end/EndScreen.test.tsx`

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-23 | Story created. Standard variant only (no celebration — Epic 3); decoupled from reducer + useHighScore (parent owns PB write logic via useEffect in App composition). Uses right-no-streak as Epic 1 stand-in pool for end-of-game acknowledgement message. | bmad-create-story (Claude Opus 4.7) |
| 2026-05-23 | Story implemented and shipped. 177 tests pass (170 prior + 7 new). All ACs satisfied on first run. Bundle unchanged — tree-shaken until Story 1.17's App composition imports it. | bmad-dev-story (Claude Opus 4.7) |
