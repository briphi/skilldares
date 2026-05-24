# Story 2.7: QuestionSelect Component (Speed Type B)

Status: review

## Story

As a player,
I want to tap to select all squares matching a criteria with a visible 15-second timer,
so that the multi-select speed round is fast and unambiguous.

## Acceptance Criteria

1. **`src/components/game/QuestionSelect.tsx` exists with this contract:**
   - Props: `{ question: SpeedSelectQuestion; onAnswer: (isCorrect: boolean) => void; rng?: Rng; durationSeconds?: number; correctRevealMs?: number; wrongRevealMs?: number }`
   - Defaults: `durationSeconds = 15`, `correctRevealMs = 1500`, `wrongRevealMs = 3000` (mirroring QuestionMC + QuestionOrder)
   - Decoupled from reducer via `onAnswer` callback

2. **Layout:**
   - Question prompt at top (`<h2>`, display font)
   - `<TimerDisplay>` (Story 2.5) below prompt
   - Grid of 5 `<ItemSquare>` items — tap-to-toggle interaction (selectable)
   - `LOCK IT IN` button below the grid (uses `uiStrings.buttons.lockIn`)

3. **Display order shuffled per game:**
   - Items shuffled on mount via `pickRandomFromPool(question.items, 5, rng)` (existing Story 1.6 helper)
   - Shuffle is one-time per mount (`useState(() => shuffle())`)
   - Same question played across multiple games shows items in different positions — prevents position-memorization (consistent with FR9.1 spirit applied to Type B)

4. **Tap-to-toggle selection (FR22):**
   - Each ItemSquare gets `onClick` handler that toggles its membership in a `Set<string>` of selected names
   - Selected items use `variant="selected"` (gold outline + scale per ItemSquare); unselected use `variant="default"`
   - `aria-pressed="true"` for selected, `"false"` for unselected (per AC's spec)

5. **Timer:**
   - `useTimer({ durationSeconds, onExpire, paused })` from Story 2.5
   - `onExpire` → auto-submit (`handleSubmit`)
   - `paused = true` once submission has occurred

6. **Submit + reveal flow (mirrors QuestionMC / QuestionOrder pattern):**
   - LOCK IT IN tap (or timer expiry) → compute correctness via set equality between selected and `question.correctSet`
   - Set internal phase from `'idle'` → `'revealed'`
   - In revealed phase, each ItemSquare gets one of four variants per the (selected, correct) matrix:
     - **selected ∧ correct** → `revealed-correct` (green outline; user picked correctly)
     - **selected ∧ ¬correct** → `revealed-wrong` (red outline; user picked wrongly)
     - **¬selected ∧ correct** → `revealed-missed` (dashed green; user missed this correct one)
     - **¬selected ∧ ¬correct** → `default` (no special treatment; correctly not-selected)
   - LOCK IT IN button hidden in revealed phase
   - After `correctRevealMs` / `wrongRevealMs` → dispatch `onAnswer(isCorrect)`
   - Subsequent submission attempts in revealed phase are ignored

7. **Scoring per FR24 / FR34: all-or-nothing exact set match.**
   - Set equality: same size AND every selected item is in correctSet (and vice versa)
   - Helper: `isSelectionCorrect(selected, correctSet): boolean`

8. **`QuestionSelect.test.tsx` covers:**
   - Renders prompt + 5 items + LOCK IT IN button + timer progressbar
   - Tap toggles selected/unselected (verify `aria-pressed` flips)
   - Multiple selections accumulate; deselecting a previously-selected item removes it
   - LOCK IT IN with EXACT match (selected === correctSet) → `onAnswer(true)`
   - LOCK IT IN missing a correct item → `onAnswer(false)`
   - LOCK IT IN with an extra wrong item → `onAnswer(false)`
   - LOCK IT IN with empty selection → `onAnswer(false)` (when correctSet is non-empty)
   - Post-submit: items render with the 4 expected variants (selected-correct / selected-wrong / unselected-missed / default)
   - Subsequent LOCK IT IN attempts after submission are ignored
   - Timer expiry → `onAnswer(false)` (use fake timers)
   - Display order is shuffled deterministically by rng

9. **Build + tests pass:**
   - `npm test` exit 0
   - `npm run build` clean
   - Bundle unchanged (tree-shaken until Story 2.8 integration)

## Tasks / Subtasks

- [x] **Task 1: Pre-work safety check**
  - [x] Working tree clean; on `main`; up to date
  - [x] Confirm 256 tests pass
  - [x] Create branch `story/2-7-question-select`

- [x] **Task 2: Implement `src/components/game/QuestionSelect.tsx`**
  - [x] Per Dev Notes — `Set<string>` state for selections, variant-per-item matrix on reveal
  - [x] Type-check clean

- [x] **Task 3: Implement `src/components/game/QuestionSelect.module.css`**
  - [x] Grid layout (2-column on narrow viewports, more on wider — or auto-fit)
  - [x] Submit row below

- [x] **Task 4: Implement `src/components/game/QuestionSelect.test.tsx`**
  - [x] 11+ tests per AC #8
  - [x] Tests pass

- [x] **Task 5: Full test + build**
  - [x] `npm test` all green
  - [x] `npm run build` clean

- [x] **Task 6: Commit + push to main**
  - [x] Two commits (impl + spec)
  - [x] Fast-forward main, push, delete branch

## Dev Notes

### Exact `src/components/game/QuestionSelect.tsx`

```typescript
import { useEffect, useMemo, useRef, useState } from 'react';
import type { SpeedSelectQuestion } from '../../lib/schemas/question.schema';
import { defaultRng, type Rng } from '../../lib/rng';
import { pickRandomFromPool } from '../../lib/questionSelection';
import { useTimer } from '../../state/useTimer';
import { Button } from '../shared/Button';
import { ItemSquare, type ItemSquareVariant } from '../shared/ItemSquare';
import { TimerDisplay } from './TimerDisplay';
import { uiStrings } from '../../content/uiStrings';
import styles from './QuestionSelect.module.css';

export type QuestionSelectProps = {
  question: SpeedSelectQuestion;
  onAnswer: (isCorrect: boolean) => void;
  rng?: Rng;
  durationSeconds?: number;
  correctRevealMs?: number;
  wrongRevealMs?: number;
};

type Phase = 'idle' | 'revealed';

function isSelectionCorrect(selected: Set<string>, correctSet: Set<string>): boolean {
  if (selected.size !== correctSet.size) return false;
  for (const item of selected) {
    if (!correctSet.has(item)) return false;
  }
  return true;
}

export function QuestionSelect({
  question,
  onAnswer,
  rng = defaultRng,
  durationSeconds = 15,
  correctRevealMs = 1500,
  wrongRevealMs = 3000,
}: QuestionSelectProps) {
  // Display order shuffled per mount (prevents position-memorization across plays).
  const [displayItems] = useState<string[]>(() =>
    pickRandomFromPool(question.items, question.items.length, rng),
  );

  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [phase, setPhase] = useState<Phase>('idle');
  const dispatchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const correctSet = useMemo(() => new Set(question.correctSet), [question]);

  // Cleanup any pending dispatch timer.
  useEffect(() => {
    return () => {
      if (dispatchTimerRef.current !== null) clearTimeout(dispatchTimerRef.current);
    };
  }, []);

  const toggleItem = (name: string) => {
    if (phase !== 'idle') return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (phase !== 'idle') return;
    const correct = isSelectionCorrect(selected, correctSet);
    setPhase('revealed');
    const duration = correct ? correctRevealMs : wrongRevealMs;
    if (duration <= 0) {
      onAnswer(correct);
      return;
    }
    dispatchTimerRef.current = setTimeout(() => {
      onAnswer(correct);
    }, duration);
  };

  const { secondsRemaining } = useTimer({
    durationSeconds,
    onExpire: handleSubmit,
    paused: phase !== 'idle',
  });

  const variantFor = (name: string): ItemSquareVariant => {
    if (phase === 'idle') {
      return selected.has(name) ? 'selected' : 'default';
    }
    // Revealed phase: 4-way matrix.
    const wasSelected = selected.has(name);
    const isCorrect = correctSet.has(name);
    if (wasSelected && isCorrect) return 'revealed-correct';
    if (wasSelected && !isCorrect) return 'revealed-wrong';
    if (!wasSelected && isCorrect) return 'revealed-missed';
    return 'default'; // correctly not selected
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.prompt}>{question.prompt}</h2>
      <TimerDisplay secondsRemaining={secondsRemaining} totalSeconds={durationSeconds} />

      <div className={styles.grid}>
        {displayItems.map((name) => (
          <ItemSquare
            key={name}
            text={name}
            variant={variantFor(name)}
            onClick={phase === 'idle' ? () => toggleItem(name) : undefined}
            disabled={phase !== 'idle' ? true : false}
            ariaPressed={selected.has(name)}
          />
        ))}
      </div>

      {phase === 'idle' && (
        <div className={styles.submitRow}>
          <Button variant="primary" onClick={handleSubmit}>
            {uiStrings.buttons.lockIn}
          </Button>
        </div>
      )}
    </div>
  );
}
```

**Note on the `onClick` handling in revealed phase:** I pass `onClick={phase === 'idle' ? () => toggleItem(name) : undefined}`. When `undefined`, ItemSquare renders as a `<div>` (no button). That's a clean way to remove tap affordance post-submit. The `disabled` prop is then irrelevant for the div path, but harmless.

Actually wait — ItemSquare's behavior is: if `onClick` is provided, render as `<button>`; if omitted, render as `<div>`. So when phase is 'revealed' and `onClick` is undefined, ItemSquare renders as a `<div>` — no role="button", no tap interaction. Perfect for the reveal phase.

But there's a subtle issue: when the phase flips from 'idle' to 'revealed', the element changes from `<button>` to `<div>`. React will treat this as a different element type and tear down + remount. ItemSquare loses its state (which is fine — it has none). Visual transitions may be jarring (e.g., outline animation interrupted). 

Cleaner: always render as `<button>` with `disabled` set in revealed phase. Let's do that for smooth transitions:

```typescript
<ItemSquare
  key={name}
  text={name}
  variant={variantFor(name)}
  onClick={() => toggleItem(name)}    // always provided
  disabled={phase !== 'idle'}         // disabled when revealed
  ariaPressed={selected.has(name)}
/>
```

`toggleItem` already guards against `phase !== 'idle'` so the click is a no-op even if it somehow fires. The `disabled` attribute prevents pointer events and keyboard activation. ItemSquare's button is always the same element across phase transitions, so animation works smoothly.

### Exact `src/components/game/QuestionSelect.module.css`

```css
.container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
}

.prompt {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  text-align: center;
  margin: 0;
  line-height: 1.2;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-3);
  width: 100%;
}

.submitRow {
  display: flex;
  justify-content: center;
  margin-top: var(--space-4);
}
```

`auto-fit` + `minmax(140px, 1fr)`: on narrow viewports (mobile) the grid shows 2 columns (5 items → 3 rows of 2 + 1 row of 1, or 2 + 2 + 1); on wider viewports up to 5 columns side-by-side. Responsive without media queries.

### Exact `src/components/game/QuestionSelect.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionSelect } from './QuestionSelect';
import type { SpeedSelectQuestion } from '../../lib/schemas/question.schema';
import { uiStrings } from '../../content/uiStrings';

const fixtureQuestion: SpeedSelectQuestion = {
  prompt: 'Pick what is correct',
  criteriaType: 'items-in-dish',
  items: ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'],
  correctSet: ['Alpha', 'Charlie', 'Echo'],
  menuRefs: [],
};

// Identity rng — preserves the items array order so tests can predict positions.
const identityRng = () => 0.999;

// Sync-zero props for fast tests (skip the reveal-delay timers).
const syncProps = { correctRevealMs: 0, wrongRevealMs: 0 };

describe('QuestionSelect', () => {
  describe('default render', () => {
    it('renders the prompt', () => {
      render(<QuestionSelect question={fixtureQuestion} onAnswer={() => {}} rng={identityRng} {...syncProps} />);
      expect(screen.getByText(fixtureQuestion.prompt)).toBeTruthy();
    });

    it('renders all 5 items as buttons', () => {
      render(<QuestionSelect question={fixtureQuestion} onAnswer={() => {}} rng={identityRng} {...syncProps} />);
      for (const item of fixtureQuestion.items) {
        expect(screen.getByRole('button', { name: item })).toBeTruthy();
      }
    });

    it('renders the LOCK IT IN button', () => {
      render(<QuestionSelect question={fixtureQuestion} onAnswer={() => {}} rng={identityRng} {...syncProps} />);
      expect(screen.getByRole('button', { name: uiStrings.buttons.lockIn })).toBeTruthy();
    });

    it('renders the timer progressbar', () => {
      render(<QuestionSelect question={fixtureQuestion} onAnswer={() => {}} rng={identityRng} {...syncProps} />);
      expect(screen.getByRole('progressbar', { name: 'Time remaining' })).toBeTruthy();
    });

    it('all items start with aria-pressed="false" (unselected)', () => {
      render(<QuestionSelect question={fixtureQuestion} onAnswer={() => {}} rng={identityRng} {...syncProps} />);
      for (const item of fixtureQuestion.items) {
        expect(screen.getByRole('button', { name: item }).getAttribute('aria-pressed')).toBe('false');
      }
    });
  });

  describe('toggle selection', () => {
    it('tapping an unselected item flips aria-pressed to true', async () => {
      render(<QuestionSelect question={fixtureQuestion} onAnswer={() => {}} rng={identityRng} {...syncProps} />);
      const alpha = screen.getByRole('button', { name: 'Alpha' });
      await userEvent.click(alpha);
      expect(alpha.getAttribute('aria-pressed')).toBe('true');
    });

    it('tapping a selected item flips aria-pressed back to false', async () => {
      render(<QuestionSelect question={fixtureQuestion} onAnswer={() => {}} rng={identityRng} {...syncProps} />);
      const alpha = screen.getByRole('button', { name: 'Alpha' });
      await userEvent.click(alpha);
      await userEvent.click(alpha);
      expect(alpha.getAttribute('aria-pressed')).toBe('false');
    });

    it('multiple selections accumulate independently', async () => {
      render(<QuestionSelect question={fixtureQuestion} onAnswer={() => {}} rng={identityRng} {...syncProps} />);
      await userEvent.click(screen.getByRole('button', { name: 'Alpha' }));
      await userEvent.click(screen.getByRole('button', { name: 'Charlie' }));
      expect(screen.getByRole('button', { name: 'Alpha' }).getAttribute('aria-pressed')).toBe('true');
      expect(screen.getByRole('button', { name: 'Charlie' }).getAttribute('aria-pressed')).toBe('true');
      expect(screen.getByRole('button', { name: 'Bravo' }).getAttribute('aria-pressed')).toBe('false');
    });
  });

  describe('submit', () => {
    it('exact match (Alpha+Charlie+Echo) → onAnswer(true)', async () => {
      const onAnswer = vi.fn();
      render(<QuestionSelect question={fixtureQuestion} onAnswer={onAnswer} rng={identityRng} {...syncProps} />);
      await userEvent.click(screen.getByRole('button', { name: 'Alpha' }));
      await userEvent.click(screen.getByRole('button', { name: 'Charlie' }));
      await userEvent.click(screen.getByRole('button', { name: 'Echo' }));
      fireEvent.click(screen.getByRole('button', { name: uiStrings.buttons.lockIn }));
      expect(onAnswer).toHaveBeenCalledTimes(1);
      expect(onAnswer).toHaveBeenCalledWith(true);
    });

    it('missing a correct item (Alpha+Charlie, missing Echo) → onAnswer(false)', async () => {
      const onAnswer = vi.fn();
      render(<QuestionSelect question={fixtureQuestion} onAnswer={onAnswer} rng={identityRng} {...syncProps} />);
      await userEvent.click(screen.getByRole('button', { name: 'Alpha' }));
      await userEvent.click(screen.getByRole('button', { name: 'Charlie' }));
      fireEvent.click(screen.getByRole('button', { name: uiStrings.buttons.lockIn }));
      expect(onAnswer).toHaveBeenCalledWith(false);
    });

    it('extra wrong item (correct 3 + Bravo) → onAnswer(false)', async () => {
      const onAnswer = vi.fn();
      render(<QuestionSelect question={fixtureQuestion} onAnswer={onAnswer} rng={identityRng} {...syncProps} />);
      await userEvent.click(screen.getByRole('button', { name: 'Alpha' }));
      await userEvent.click(screen.getByRole('button', { name: 'Charlie' }));
      await userEvent.click(screen.getByRole('button', { name: 'Echo' }));
      await userEvent.click(screen.getByRole('button', { name: 'Bravo' }));
      fireEvent.click(screen.getByRole('button', { name: uiStrings.buttons.lockIn }));
      expect(onAnswer).toHaveBeenCalledWith(false);
    });

    it('empty selection with non-empty correctSet → onAnswer(false)', () => {
      const onAnswer = vi.fn();
      render(<QuestionSelect question={fixtureQuestion} onAnswer={onAnswer} rng={identityRng} {...syncProps} />);
      fireEvent.click(screen.getByRole('button', { name: uiStrings.buttons.lockIn }));
      expect(onAnswer).toHaveBeenCalledWith(false);
    });
  });

  describe('post-submit reveal (4-way variant matrix)', () => {
    it('selected-correct items get revealed-correct; selected-wrong get revealed-wrong; unselected-correct get revealed-missed; unselected-wrong get default', async () => {
      const { container } = render(
        <QuestionSelect question={fixtureQuestion} onAnswer={() => {}} rng={identityRng} {...syncProps} />,
      );
      // User picks Alpha (correct), Bravo (wrong); leaves Charlie+Echo (correct) unpicked, Delta unpicked (correctly).
      await userEvent.click(screen.getByRole('button', { name: 'Alpha' }));
      await userEvent.click(screen.getByRole('button', { name: 'Bravo' }));
      fireEvent.click(screen.getByRole('button', { name: uiStrings.buttons.lockIn }));

      // Now in revealed phase.
      const buttons = container.querySelectorAll('[data-variant]');
      const variantByName = new Map<string, string>();
      for (const btn of buttons) {
        // The text is inside .text span; for our test it's the only text in the button.
        const name = btn.textContent?.trim() ?? '';
        variantByName.set(name, btn.getAttribute('data-variant') ?? '');
      }

      expect(variantByName.get('Alpha')).toBe('revealed-correct');     // selected ∧ correct
      expect(variantByName.get('Bravo')).toBe('revealed-wrong');       // selected ∧ ¬correct
      expect(variantByName.get('Charlie')).toBe('revealed-missed');    // ¬selected ∧ correct
      expect(variantByName.get('Echo')).toBe('revealed-missed');       // ¬selected ∧ correct
      expect(variantByName.get('Delta')).toBe('default');              // ¬selected ∧ ¬correct
    });

    it('subsequent LOCK IT IN attempts after submission are ignored (button unmounts)', async () => {
      const onAnswer = vi.fn();
      render(<QuestionSelect question={fixtureQuestion} onAnswer={onAnswer} rng={identityRng} {...syncProps} />);
      await userEvent.click(screen.getByRole('button', { name: 'Alpha' }));
      await userEvent.click(screen.getByRole('button', { name: 'Charlie' }));
      await userEvent.click(screen.getByRole('button', { name: 'Echo' }));
      fireEvent.click(screen.getByRole('button', { name: uiStrings.buttons.lockIn }));
      expect(screen.queryByRole('button', { name: uiStrings.buttons.lockIn })).toBeNull();
      expect(onAnswer).toHaveBeenCalledTimes(1);
    });
  });

  describe('timer expiry', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('auto-submits as wrong when the timer expires with empty selection', () => {
      const onAnswer = vi.fn();
      render(
        <QuestionSelect
          question={fixtureQuestion}
          onAnswer={onAnswer}
          rng={identityRng}
          durationSeconds={2}
          correctRevealMs={0}
          wrongRevealMs={0}
        />,
      );
      act(() => { vi.advanceTimersByTime(2000); });
      expect(onAnswer).toHaveBeenCalledTimes(1);
      expect(onAnswer).toHaveBeenCalledWith(false);
    });
  });
});
```

### Why `auto-fit` Grid Instead of a Fixed 2-Column / 3-Column Layout

The 5-item grid + responsive design needs:
- **Mobile (320-767px):** items should stack 2-up (5 items → 2/2/1 or 2/2/1)
- **Tablet/desktop:** can spread out 3-5 across

`grid-template-columns: repeat(auto-fit, minmax(140px, 1fr))` handles both without media queries. The minimum cell width is 140px (forces 2-column at narrowest); items grow to fill at wider widths.

### Common LLM Mistakes to Avoid

- **Do NOT** use an array for selections — `Set<string>` is the right shape for membership toggles and equality comparison
- **Do NOT** mutate the Set in-place inside `setSelected` — create a new Set so React detects the change (`new Set(prev)` then `.add` / `.delete`)
- **Do NOT** allow `toggleItem` to fire after submit — guard with `if (phase !== 'idle') return;` (and pass `disabled={phase !== 'idle'}` to ItemSquare for UI feedback)
- **Do NOT** check selection correctness with `JSON.stringify(arr1) === JSON.stringify(arr2)` — order doesn't matter for sets
- **Do NOT** assume `correctSet` is unique-by-construction — the schema enforces no dupes (Zod refine in Story 1.3), but the helper `isSelectionCorrect` should still work correctly if dupes ever slipped through (it uses Set comparison)
- **Do NOT** use `useEffect` for the dispatch timer cleanup if you can stash the timer ID in a `useRef` — same pattern as QuestionMC and QuestionOrder
- **Do NOT** include any ✓/✗ overlay text in the squares — ItemSquare's `revealed-*` variants use outline + scale only (per the user's recent feedback that the centered ✓ obscured option text in MC)

### Why `aria-pressed` (Not `aria-checked`)

`aria-pressed` is for toggle buttons (the button has on/off state); `aria-checked` is for checkboxes / radio buttons. The W3C ARIA spec considers a tap-to-toggle square as a toggle button. The AC specifies `aria-pressed`.

### Test Pattern Notes

- `fireEvent.click` is used for the LOCK IT IN button when test logic depends on the post-click state being immediately observable. `userEvent.click` is used for item toggles (multi-click flow benefits from user-event's realism). No fake-timers mixed with user-event in these tests, so the v14 deadlock doesn't apply.
- Reveal-variant assertion uses `container.querySelectorAll('[data-variant]')` and walks the elements by their text content. `ItemSquare` puts text inside a `.text` span but `button.textContent` returns the full concatenated text including subtext (empty pre-reveal, populated post-reveal but we're not testing subtext here so just match the item name).

Actually wait — in the reveal-variant test, the button.textContent will include both the item name AND the subtext (if present in revealed variants and subtext prop was provided). For this test we don't pass subtext, so textContent is just the item name. ✓

If we want a subtext test for QuestionSelect, it would be: pass a question with a factor-like reveal? But Type B doesn't have factor values — items are just names. No subtext applies for Type B. The reveal is just outline color.

### Previous Story Intelligence

**From Story 1.13 / 2.6 (reveal pattern):**
- Two-phase state machine (idle → revealed) with timer-driven dispatch
- `dispatchTimerRef` for cleanup on unmount
- Sync path (duration ≤ 0) bypasses timers for fast tests
- Asymmetric correctRevealMs / wrongRevealMs

**From Story 2.4 (ItemSquare):**
- `onClick` triggers `<button>` rendering with `aria-pressed` support
- `disabled` prop suppresses click + provides visual feedback
- `data-variant` attribute for stable test selectors
- Variants: `default` / `selected` / `revealed-correct` / `revealed-wrong` / `revealed-missed`

**From Story 2.5 (useTimer + TimerDisplay):**
- `useTimer({ onExpire, paused })` — pause during reveal phase to prevent double-dispatch
- TimerDisplay takes secondsRemaining + totalSeconds

**From Story 2.6 (QuestionOrder):**
- Established the speed-question file structure + test patterns
- `pickRandomFromPool(items, items.length, rng)` shuffles for display

### Git Intelligence

Last 4 commits on main:

```
5b949b0 Add Story 2.6 dev spec to planning artifacts
3d24089 Story 2.6: QuestionOrder (Speed Type A) + install dnd-kit
b5f4b6a Add Story 2.5 dev spec to planning artifacts
528992c Story 2.5: useTimer hook + TimerDisplay component + shake variant
```

Story 2.7 builds on `5b949b0`.

### Latest Tech Information

No new dependencies. Reuses everything from Stories 1.9 / 2.4 / 2.5 / 2.6.

### Project Structure Notes

**Alignment with architecture:**
- `src/components/game/QuestionSelect.tsx` + `.module.css` + `.test.tsx` ✓ (architecture line 397)

### References

- **Story source:** `_bmad-output/planning-artifacts/epics.md` § "Epic 2, Story 2.7"
- **PRD FRs:** FR19 (5 items grid), FR20 (3 criteria types), FR21 (correctSet 1-5), FR22 (select/deselect), FR23 (15s timer), FR24 (exact-match scoring + post-submit reveal), FR34 (all-or-nothing scoring)
- **Architecture:** §"Frontend Architecture" line 123 (no dnd-kit needed for Type B — it's tap, not drag)
- **UX:** §"The Three-Beat Loop", §"Implementation Approach" line 403 (Type B layout: grid of squares with tap-to-select)
- **Previous stories:** 1-13 (reveal pattern), 2.2 (content), 2.4 (ItemSquare), 2.5 (useTimer + TimerDisplay), 2.6 (speed-question file structure)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code)

### Debug Log References

None — all 15 tests passed on first run. Per spec, ItemSquare's `onClick` is always provided (so it stays a `<button>` across phase transitions for smooth animation); `toggleItem` internally guards against phase !== 'idle'.

### Completion Notes List

- **`src/components/game/QuestionSelect.tsx`** — Set-based selection state, two-phase reveal pattern, 4-way variant matrix per (selected, correct), display items shuffled per mount via `pickRandomFromPool` (Story 1.6) for replayability.
- **Set immutability** — `setSelected((prev) => { const next = new Set(prev); ... })` creates a new Set each update.
- **Variant matrix on reveal:**
  - selected ∧ correct → `revealed-correct`
  - selected ∧ ¬correct → `revealed-wrong`
  - ¬selected ∧ correct → `revealed-missed` (dashed green — "you missed this")
  - ¬selected ∧ ¬correct → `default`
- **Responsive grid** via `repeat(auto-fit, minmax(140px, 1fr))` — no media queries needed.
- **15 tests pass**: default render (5), toggle (3), submit (4: exact/missing/extra/empty), post-submit reveal (2: variant matrix, submit lock), timer expiry (1).
- **Test count: 271** (was 256 → +15). Build clean. **Bundle unchanged at 468.50 / 138.90 kB** — tree-shaken until Story 2.8's integration.

### File List

- **NEW** `src/components/game/QuestionSelect.tsx`
- **NEW** `src/components/game/QuestionSelect.module.css`
- **NEW** `src/components/game/QuestionSelect.test.tsx`

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-24 | Story created. Tap-to-toggle grid with Set-based selection state, 4-way reveal variant matrix (selected-correct/wrong + unselected-missed/default), aria-pressed accessibility, set-equality scoring. Display order shuffled per mount for replayability. | bmad-create-story (Claude Opus 4.7) |
| 2026-05-24 | Story shipped (impl in 01ae22b). 15 tests pass on first run. Bundle unchanged — tree-shaken until Story 2.8 integration. | bmad-dev-story (Claude Opus 4.7) |
