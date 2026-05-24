# Story 1.14: Feedback Overlay

Status: review

## Story

As a player,
I want the personality voice to land after every answer with a clear correct/incorrect verdict, the points I got, and a button that appears after a brief read-pause to advance,
so that the post-answer beat feels charged and the voice gets stage time.

## Acceptance Criteria

1. **`src/components/game/FeedbackOverlay.tsx` exists with this contract:**
   - Props: `{ isCorrect: boolean; message: string; pointsAwarded: number; pool: MessagePoolId; isLastRound: boolean; onAdvance: () => void; revealDelayMs?: number }`
   - `message` is the already-selected personality string (parent computes via `pickMessage` from Story 1.6 + the appropriate pool JSON; FeedbackOverlay stays purely presentational, no JSON imports)
   - `revealDelayMs` defaults to `400` (FR-ish — see UX spec "Next/Finish button appears ≈400ms after verdict"); tests pass `0` for instant reveal
   - Decoupled from reducer: `onAdvance` is wired by parent to `helpers.advanceToNext()` or `helpers.finishGame()` based on `isLastRound`

2. **Renders four things in order:**
   - Big ✓ or ✗ icon (display font, `--text-3xl` or larger)
   - Personality message (display font, `--text-2xl`/`--text-3xl`, voice forward)
   - Points indicator (e.g., `"+5"` for correct-no-hint, `"+2"` for correct-with-hint, `"+0"` for wrong — formatted as `"+{pointsAwarded}"` with no extra label)
   - Next/Finish button — `<Button variant="primary">` from Story 1.9; appears AFTER `revealDelayMs`

3. **Six visual variants (one per per-answer pool):**
   - `right-no-streak` — subtle green tint background
   - `wrong-no-streak` — subtle red tint background
   - `on-fire` — brand-accent tint (`--color-brand-accent`)
   - `streak-broken` — dramatic red background
   - `comeback` — celebratory tint (`--color-brand-secondary` deep green)
   - `doing-bad` — dramatic-red treatment (same family as streak-broken; spiraling state)
   - Each variant gets its own CSS Module class; component reads `pool` prop and applies the matching class
   - `data-pool` attribute on the root for stable test selectors

4. **Delayed reveal of Next/Finish button:**
   - On mount, button is NOT rendered
   - After `revealDelayMs` (default 400ms), the button mounts
   - Implementation: `useState(false)` + `useEffect` with `setTimeout`; cleanup on unmount cancels the timer (no memory leaks if user advances before reveal — though they can't, since the button is the only way to advance)

5. **Next vs Finish button label:**
   - `isLastRound=false` → label is `uiStrings.buttons.next` (`'NEXT →'`)
   - `isLastRound=true` → label is `uiStrings.buttons.finish` (`'FINISH IT'`)
   - In both cases, tapping calls `onAdvance` once

6. **Accessibility:**
   - Outer container has `role="alert"` so screen readers announce the verdict + message on mount
   - The ✓ / ✗ icon has `aria-hidden="true"` (decorative; redundant with the message text the alert announces)
   - Points indicator is plain text (announced as part of the alert)

7. **`FeedbackOverlay.test.tsx` covers:**
   - Renders ✓ when isCorrect=true
   - Renders ✗ when isCorrect=false
   - Renders the message text from props
   - Renders the points indicator as `"+{pointsAwarded}"`
   - Has `role="alert"` on the root
   - Each of the 6 pool variants applies a distinct `data-pool` attribute
   - Next button is NOT in the DOM immediately after mount (with default delay)
   - Next button DOES appear after the delay elapses (uses `vi.useFakeTimers()` + `vi.advanceTimersByTime`)
   - Next button label is `'NEXT →'` when `isLastRound=false`, `'FINISH IT'` when `isLastRound=true`
   - Tapping Next/Finish calls `onAdvance` exactly once
   - With `revealDelayMs={0}` the button appears synchronously (no need to advance timers)

8. **Build + tests pass:**
   - `npm test` exit 0 (146 prior + ~12 new)
   - `npm run build` clean
   - Bundle unchanged (not yet consumed by App.tsx)

## Tasks / Subtasks

- [x] **Task 1: Pre-work safety check**
  - [x] Working tree clean; on `main`; up to date
  - [x] Verify Story 1.13 in place: `src/components/game/QuestionMC.tsx`; 146 tests pass
  - [x] Create branch `story/1-14-feedback-overlay`

- [x] **Task 2: Implement `src/components/game/FeedbackOverlay.tsx`**
  - [x] File per Dev Notes (useState + useEffect for delayed reveal, props per AC #1, role=alert on root)
  - [x] Type-check clean

- [x] **Task 3: Implement `src/components/game/FeedbackOverlay.module.css`**
  - [x] 6 variant classes + base layout per Dev Notes
  - [x] Design tokens via `var(--...)`

- [x] **Task 4: Implement `src/components/game/FeedbackOverlay.test.tsx`**
  - [x] 11+ tests per AC #7
  - [x] Uses `vi.useFakeTimers()` for the delay assertion
  - [x] All pass

- [x] **Task 5: Full test + build verification**
  - [x] `npm test` all green
  - [x] `npm run build` clean

- [x] **Task 6: Commit + push to main**
  - [x] Two commits (src + spec)
  - [x] Fast-forward main, push, delete branch

## Dev Notes

### Why FeedbackOverlay Is Purely Presentational (No JSON Imports)

Unlike StartScreen (which imports its one pool and picks once on mount), FeedbackOverlay would need access to 6 different pool JSONs and would re-pick on every new round. That logic belongs in the parent (GameScreen in Story 1.15) so:

- FeedbackOverlay's tests don't need to mock JSON imports — just pass a fixture string
- The message-selection rng injection happens once at the GameScreen level (consistent with how `selectGameQuestions` works in Story 2.3)
- The overlay re-mounts via `key={lastFeedback.pool + roundIndex}` or similar each round, but doesn't internally manage pool data

This keeps the overlay tiny, testable in isolation, and lets the parent control message lifecycle.

### Exact `src/components/game/FeedbackOverlay.tsx`

```typescript
import { useEffect, useState } from 'react';
import type { MessagePoolId } from '../../lib/schemas/message.schema';
import { Button } from '../shared/Button';
import { uiStrings } from '../../content/uiStrings';
import styles from './FeedbackOverlay.module.css';

export type FeedbackOverlayProps = {
  isCorrect: boolean;
  message: string;
  pointsAwarded: number;
  pool: MessagePoolId;
  isLastRound: boolean;
  onAdvance: () => void;
  /** Override the Next/Finish reveal delay — used by tests. Defaults to 400ms (UX spec). */
  revealDelayMs?: number;
};

export function FeedbackOverlay({
  isCorrect,
  message,
  pointsAwarded,
  pool,
  isLastRound,
  onAdvance,
  revealDelayMs = 400,
}: FeedbackOverlayProps) {
  const [buttonRevealed, setButtonRevealed] = useState<boolean>(revealDelayMs <= 0);

  useEffect(() => {
    if (revealDelayMs <= 0) return;
    const id = setTimeout(() => setButtonRevealed(true), revealDelayMs);
    return () => clearTimeout(id);
  }, [revealDelayMs]);

  const variantClass = styles[poolVariantKey(pool)] ?? '';
  const containerClasses = [styles.container, variantClass].join(' ');
  const verdictIcon = isCorrect ? '✓' : '✗';
  const buttonLabel = isLastRound ? uiStrings.buttons.finish : uiStrings.buttons.next;

  return (
    <div role="alert" className={containerClasses} data-pool={pool}>
      <div className={styles.icon} aria-hidden="true">{verdictIcon}</div>
      <p className={styles.message}>{message}</p>
      <p className={styles.points}>+{pointsAwarded}</p>
      {buttonRevealed && (
        <Button variant="primary" onClick={onAdvance}>
          {buttonLabel}
        </Button>
      )}
    </div>
  );
}

function poolVariantKey(pool: MessagePoolId): keyof typeof styles {
  switch (pool) {
    case 'right-no-streak': return 'variantRightNoStreak';
    case 'wrong-no-streak': return 'variantWrongNoStreak';
    case 'on-fire':         return 'variantOnFire';
    case 'streak-broken':   return 'variantStreakBroken';
    case 'comeback':        return 'variantComeback';
    case 'doing-bad':       return 'variantDoingBad';
    // pre-game-encouragement and new-high-score should never reach here;
    // fall back to a neutral variant if they do.
    default:                return 'variantRightNoStreak';
  }
}
```

### Exact `src/components/game/FeedbackOverlay.module.css`

```css
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  padding: var(--space-7) var(--space-6);
  border-radius: var(--radius-lg);
  text-align: center;
  max-width: 640px;
  margin: 0 auto;
  width: 100%;
  min-height: 360px;
  transition: background-color var(--motion-base) var(--ease-snappy);
}

.icon {
  font-size: var(--text-3xl);
  font-weight: var(--font-weight-black);
  color: var(--color-text-primary);
  line-height: 1;
}

.message {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-black);
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.2;
  max-width: 540px;
}

.points {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-brand-primary);
  margin: 0;
  font-variant-numeric: tabular-nums;
}

/* Variants — background tints driven by pool */

.variantRightNoStreak {
  background-color: color-mix(in srgb, var(--color-state-success) 12%, var(--color-bg-elevated));
}

.variantWrongNoStreak {
  background-color: color-mix(in srgb, var(--color-state-error) 12%, var(--color-bg-elevated));
}

.variantOnFire {
  background-color: color-mix(in srgb, var(--color-brand-accent) 22%, var(--color-bg-elevated));
}

.variantStreakBroken {
  background-color: color-mix(in srgb, var(--color-state-error) 30%, var(--color-bg-elevated));
}

.variantComeback {
  background-color: color-mix(in srgb, var(--color-brand-secondary) 25%, var(--color-bg-elevated));
}

.variantDoingBad {
  background-color: color-mix(in srgb, var(--color-state-error) 28%, var(--color-bg-elevated));
}
```

> `color-mix(in srgb, A %, B)` produces tinted backgrounds without committing new opaque hex values per variant. Supported in all evergreen browsers (Chrome 111+, Safari 16.2+, Firefox 113+) — comfortably within the NFR3 browser-support window (latest 2 versions of Safari + Chrome).

### Exact `src/components/game/FeedbackOverlay.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedbackOverlay } from './FeedbackOverlay';
import { uiStrings } from '../../content/uiStrings';
import type { MessagePoolId } from '../../lib/schemas/message.schema';

const baseProps = {
  message: 'Test message.',
  pointsAwarded: 5,
  pool: 'right-no-streak' as MessagePoolId,
  isLastRound: false,
  onAdvance: () => {},
};

describe('FeedbackOverlay', () => {
  describe('verdict + content', () => {
    it('renders ✓ when isCorrect=true', () => {
      render(<FeedbackOverlay {...baseProps} isCorrect revealDelayMs={0} />);
      expect(screen.getByText('✓')).toBeTruthy();
    });

    it('renders ✗ when isCorrect=false', () => {
      render(<FeedbackOverlay {...baseProps} isCorrect={false} revealDelayMs={0} />);
      expect(screen.getByText('✗')).toBeTruthy();
    });

    it('renders the message text from props', () => {
      render(<FeedbackOverlay {...baseProps} isCorrect message="Custom voice line." revealDelayMs={0} />);
      expect(screen.getByText('Custom voice line.')).toBeTruthy();
    });

    it('renders the points indicator as "+{pointsAwarded}"', () => {
      render(<FeedbackOverlay {...baseProps} isCorrect pointsAwarded={2} revealDelayMs={0} />);
      expect(screen.getByText('+2')).toBeTruthy();
    });

    it('renders +0 for a wrong answer', () => {
      render(<FeedbackOverlay {...baseProps} isCorrect={false} pointsAwarded={0} revealDelayMs={0} />);
      expect(screen.getByText('+0')).toBeTruthy();
    });

    it('marks the root with role="alert"', () => {
      render(<FeedbackOverlay {...baseProps} isCorrect revealDelayMs={0} />);
      expect(screen.getByRole('alert')).toBeTruthy();
    });
  });

  describe('pool variants', () => {
    const pools: MessagePoolId[] = [
      'right-no-streak',
      'wrong-no-streak',
      'on-fire',
      'streak-broken',
      'comeback',
      'doing-bad',
    ];

    for (const pool of pools) {
      it(`marks the root with data-pool="${pool}" for pool=${pool}`, () => {
        const { container } = render(
          <FeedbackOverlay {...baseProps} isCorrect pool={pool} revealDelayMs={0} />,
        );
        const root = container.querySelector(`[data-pool="${pool}"]`);
        expect(root).toBeTruthy();
      });
    }
  });

  describe('Next/Finish button label', () => {
    it('shows "NEXT →" when isLastRound=false', () => {
      render(<FeedbackOverlay {...baseProps} isCorrect isLastRound={false} revealDelayMs={0} />);
      expect(screen.getByRole('button', { name: uiStrings.buttons.next })).toBeTruthy();
    });

    it('shows "FINISH IT" when isLastRound=true', () => {
      render(<FeedbackOverlay {...baseProps} isCorrect isLastRound revealDelayMs={0} />);
      expect(screen.getByRole('button', { name: uiStrings.buttons.finish })).toBeTruthy();
    });

    it('calls onAdvance exactly once when tapped', async () => {
      const onAdvance = vi.fn();
      render(<FeedbackOverlay {...baseProps} isCorrect onAdvance={onAdvance} revealDelayMs={0} />);
      await userEvent.click(screen.getByRole('button', { name: uiStrings.buttons.next }));
      expect(onAdvance).toHaveBeenCalledTimes(1);
    });
  });

  describe('delayed reveal of the Next button', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('does not render the button immediately on mount with default delay', () => {
      render(<FeedbackOverlay {...baseProps} isCorrect />);
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('reveals the button after revealDelayMs elapses', () => {
      render(<FeedbackOverlay {...baseProps} isCorrect revealDelayMs={400} />);
      expect(screen.queryByRole('button')).toBeNull();
      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(screen.getByRole('button')).toBeTruthy();
    });
  });
});
```

### Common LLM Mistakes to Avoid

- **Do NOT** import message pool JSON in this component — parent owns message selection (decoupling rule)
- **Do NOT** rely on the count-up animation here — `ScoreDisplay` (Story 1.11) owns count-up; FeedbackOverlay just shows the static `+{pointsAwarded}` indicator
- **Do NOT** dispatch directly — `onAdvance` callback prop
- **Do NOT** add a "Skip" button or a swipe gesture — the only way to advance is the revealed button (UX spec rejects skip)
- **Do NOT** use `aria-live` on the root — `role="alert"` is the correct ARIA pattern for this exact use case (implicit `aria-live="assertive"` for safety + role context)
- **Do NOT** add an `aria-label` to the ✓/✗ — the symbol is decorative; the alert's text content (message + points) is what gets announced
- **Do NOT** use `setInterval` for the delay — `setTimeout` + cleanup is the right primitive
- **Do NOT** put the delay value inline in the useEffect (e.g., 400) — use the `revealDelayMs` prop so tests can override

### Testing Standards

- Vitest + jsdom (configured)
- `vi.useFakeTimers()` for the delay test; `vi.advanceTimersByTime` to fire the setTimeout
- `act()` wraps the timer advance so React processes the state update
- `screen.queryByRole('button')` returns null when absent (vs `getByRole` which throws) — use `query` for "should not exist" assertions
- `data-pool` attribute for variant assertion (decoupled from CSS class names)

### Previous Story Intelligence

**From Story 1.9 (Button + uiStrings):**
- `<Button variant="primary">` for the Next/Finish button
- `uiStrings.buttons.next` = `'NEXT →'`, `uiStrings.buttons.finish` = `'FINISH IT'`

**From Story 1.3 (schemas):**
- `MessagePoolId` is a Zod enum: `'pre-game-encouragement' | 'right-no-streak' | 'wrong-no-streak' | 'on-fire' | 'doing-bad' | 'streak-broken' | 'comeback' | 'new-high-score'`
- Import: `import type { MessagePoolId } from '../../lib/schemas/message.schema'`

**From Story 1.13 (QuestionMC):**
- `data-*` attributes give stable test selectors without coupling tests to CSS class names
- Component decoupled from reducer via callback prop (`onAnswer` there, `onAdvance` here)

### Git Intelligence

Last 4 commits on main:

```
4dd896a Add Story 1.13 dev spec to planning artifacts
af50231 Story 1.13: QuestionMC — 4-quadrant MC with lock, reveal, and hint greying
68f22e4 Add Story 1.12 dev spec to planning artifacts
6d4373a Story 1.12: HintButton — thin secondary-pill wrapper
```

Story 1.14 builds on `4dd896a`.

### Latest Tech Information

- **CSS `color-mix(in srgb, A %, B)`** — supported in Chrome 111+, Safari 16.2+, Firefox 113+. Within NFR3 browser-support window.
- No new dependencies.

### Project Structure Notes

**Alignment with architecture:**
- `src/components/game/FeedbackOverlay.tsx` + `.module.css` + `.test.tsx` ✓ (architecture lines 396–398)
- Decoupled from reducer via `onAdvance` callback — consistent with all other Epic 1 components

### References

- **Story source:** `_bmad-output/planning-artifacts/epics.md` § "Epic 1, Story 1.14"
- **PRD FRs:** FR36 (verdict + message after every answer), FR41 (voice consistency); related: FR30–FR34 (the points value computed by `scoring.ts`)
- **Architecture:** §"Requirements → File Mapping" (F7), §"Data Flow" line 515 (FeedbackOverlay reads currentFeedback)
- **UX:** §"The Three-Beat Loop" (Beat 2), §"Loop Variants by Player State" (line 268 — the 5 visual variants), §"Implementation Approach" line 404 (4 visual elements + 400ms delay)
- **Previous stories:** 1-3 (MessagePoolId), 1-9 (Button + uiStrings), 1-13 (data-* selectors)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code)

### Debug Log References

None — 17/17 tests passed on first run. `vi.useFakeTimers()` + `vi.advanceTimersByTime(400)` wrapped in `act()` fired the delayed-reveal setTimeout cleanly.

### Completion Notes List

- `src/components/game/FeedbackOverlay.tsx` — purely presentational: takes pre-selected `message`, `isCorrect`, `pointsAwarded`, `pool`, `isLastRound`, `onAdvance`, optional `revealDelayMs` (default 400). No JSON imports; parent (GameScreen, Story 1.15) will own message selection.
- Delayed reveal via `useState(revealDelayMs <= 0)` + `useEffect` with `setTimeout` and cleanup. Tests pass `revealDelayMs={0}` for synchronous render or `400` + fake timers for the delay assertion.
- 6 pool variants via CSS `color-mix(in srgb, A %, B)` — produces tinted backgrounds without committing new opaque hex values. Within NFR3 browser-support window.
- `data-pool` attribute on root for stable variant assertions; `role="alert"` for screen-reader announcement.
- 17 tests pass: verdict + content (6), pool variants (6), button label + click (3), delayed reveal (2).
- **Test count: 163** (was 146 → +17).
- **Bundle: 194.36 kB / gzip 61.24 kB — unchanged.** FeedbackOverlay tree-shaken until GameScreen (Story 1.15) imports it.

### File List

- **NEW** `src/components/game/FeedbackOverlay.tsx`
- **NEW** `src/components/game/FeedbackOverlay.module.css`
- **NEW** `src/components/game/FeedbackOverlay.test.tsx`

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-23 | Story created. Purely presentational overlay (parent owns message selection); 6 pool variants via color-mix() tinted backgrounds; 400ms delayed Next/Finish button reveal via useState+setTimeout; role="alert" for screen-reader announcement. | bmad-create-story (Claude Opus 4.7) |
| 2026-05-23 | Story implemented and shipped. 163 tests pass (146 prior + 17 new). All ACs satisfied on first run. Bundle unchanged — tree-shaken until Story 1.15's GameScreen imports it. | bmad-dev-story (Claude Opus 4.7) |
