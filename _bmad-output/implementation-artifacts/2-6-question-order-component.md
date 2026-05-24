# Story 2.6: QuestionOrder Component (Speed Type A)

Status: review

## Story

As a player,
I want to drag menu items into the correct order on touchscreen, mouse, or keyboard with a visible 15-second timer,
so that the drag-to-order speed round works reliably on my phone and respects accessibility.

## ⚠️ Installs dnd-kit (deferred from Story 1.1)

The architecture (line 123) calls for `@dnd-kit/core` + `@dnd-kit/sortable` but Story 1.1's scaffold didn't include them. The epic's Story 2.6 AC says "Given dnd-kit dependencies are installed (Story 1.1)" — that was aspirational. This story does the install.

## Acceptance Criteria

1. **`@dnd-kit/core` and `@dnd-kit/sortable` installed** as `dependencies` (latest stable). Build + tests pass with the new packages.

2. **`src/components/game/QuestionOrder.tsx` exists with this contract:**
   - Props: `{ question: SpeedOrderQuestion; onAnswer: (isCorrect: boolean) => void; rng?: Rng; durationSeconds?: number; correctRevealMs?: number; wrongRevealMs?: number }`
   - Defaults: `durationSeconds = 15`, `correctRevealMs = 1500`, `wrongRevealMs = 3000` (mirroring QuestionMC)
   - Decoupled from reducer via `onAnswer` callback (parent / GameScreen wires)
   - `rng` for deterministic initial shuffle in tests

3. **Layout:**
   - Question prompt at top (`<h2>`, display font)
   - `<TimerDisplay>` (Story 2.5) below prompt
   - Sortable list of `<ItemSquare>` rows (Story 2.4) — initially shuffled
   - `LOCK IT IN` button at the bottom (`<Button variant="primary">` from Story 1.9, uses `uiStrings.buttons.lockIn`)

4. **Initial item order:**
   - Items are stored in `question.items` in CANONICAL (correct) order — per Story 2.1's authoring convention
   - On mount, QuestionOrder shuffles for display via `pickRandomFromPool(items, items.length, rng)` (existing Story 1.6 helper)
   - Shuffle is one-time per mount (`useState(() => shuffle())`)

5. **Drag-and-drop via dnd-kit:**
   - `<DndContext>` with `PointerSensor`, `TouchSensor`, `KeyboardSensor` from `@dnd-kit/core` (all sensors enabled per architecture line 312)
   - `<SortableContext>` with `verticalListSortingStrategy` from `@dnd-kit/sortable`
   - Each row uses `useSortable({ id: itemName })` — item names are unique (verified in Story 2.1 content)
   - Drag pickup: slight scale + shadow per UX spec ("snappy pickup")
   - `onDragEnd` reorders the local state using `arrayMove` from `@dnd-kit/sortable`
   - Works on touch (mobile Safari + Chrome), pointer (desktop), and keyboard (Tab + Space + arrow keys)

6. **Timer:**
   - `useTimer({ durationSeconds, onExpire, paused })` from Story 2.5
   - `onExpire` → auto-submit as wrong (`handleSubmit(true /* viaTimer */)`)
   - `paused = true` once submission has occurred (so timer doesn't keep counting during reveal phase)

7. **Submit + reveal flow (mirrors QuestionMC's reveal pattern):**
   - LOCK IT IN tap (or timer expiry) → compute correctness via `isOrderCorrect(currentOrder, canonical)` (extracted helper)
   - Set internal phase from `'idle'` → `'revealed'`
   - In revealed phase:
     - Each ItemSquare uses `revealed-correct` variant if its position matches canonical, `revealed-wrong` otherwise
     - Each ItemSquare's `subtext` shows the item's `factorValue` formatted (e.g., `"$8.99"` for price, `"4.2% ABV"` for ABV)
     - LOCK IT IN button is hidden (or shows as disabled)
   - After `correctRevealMs` (correct) or `wrongRevealMs` (wrong) → dispatch `onAnswer(isCorrect)`
   - Subsequent submission attempts in revealed phase are ignored

8. **Factor value formatting:**
   - `price` factor: `"$N"` or `"$N.NN"` (uses `Intl.NumberFormat` with currency `USD`)
   - `ABV` factor: `"N.N% ABV"` (e.g., `"4.2% ABV"`)
   - Helper function: `formatFactorValue(value, factor): string`

9. **`QuestionOrder.test.tsx` covers:**
   - Renders prompt + LOCK IT IN button + timer bar
   - Renders all items in initially-shuffled order (with deterministic rng)
   - LOCK IT IN before any reorder (with shuffle that produces a wrong order) → `onAnswer(false)` after wrongRevealMs (use sync-zero props)
   - LOCK IT IN with a manually-correct order (use identity rng that produces canonical order) → `onAnswer(true)` after correctRevealMs
   - Post-submit: items render with `data-variant="revealed-correct"` / `revealed-wrong` per position
   - Post-submit: factor subtext appears (verify "$" or "%" in rendered text)
   - Subsequent LOCK IT IN taps after submission are ignored (single onAnswer call)
   - Timer-expiry: with fake timers, advancing past durationSeconds → onAnswer(false)
   - Keyboard reorder OPTIONAL: light test via `fireEvent.keyDown` on a focused item — verify the order changes. If flaky in jsdom, defer to integration story 2.8.

10. **Build + tests pass:**
    - `npm install` succeeds (dnd-kit added)
    - `npm test` exit 0
    - `npm run build` clean
    - Bundle grows for dnd-kit runtime (~15-25 kB gzip). Note exact size in completion notes.

## Tasks / Subtasks

- [x] **Task 1: Pre-work safety check + install dnd-kit**
  - [x] Working tree clean; on `main`; up to date
  - [x] Confirm 240 tests pass
  - [x] `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities` (utilities provides `CSS.Transform.toString`)
  - [x] Verify install: `npm ls @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
  - [x] Confirm 240 tests still pass after install
  - [x] Create branch `story/2-6-question-order`

- [x] **Task 2: Implement `formatFactorValue` helper + test**
  - [x] Add to `src/lib/formatters.ts` (new file) — pure utility
  - [x] 2 tests: price formatting, ABV formatting
  - [x] Type-check clean

- [x] **Task 3: Implement `isOrderCorrect` helper (pure, extractable for clean testing)**
  - [x] Could live inside QuestionOrder.tsx if private, or in `src/lib/questionSelection.ts` if reusable. Prefer co-located in QuestionOrder for now since only one consumer.

- [x] **Task 4: Implement `src/components/game/QuestionOrder.tsx`**
  - [x] Per Dev Notes — dnd-kit DndContext + SortableContext + useSortable wrappers
  - [x] Two-phase state machine (idle / revealed) with timers
  - [x] Type-check clean

- [x] **Task 5: Implement `src/components/game/QuestionOrder.module.css`**
  - [x] Sortable item row layout (full-width, slight shadow on drag), grid gap, lock button bottom

- [x] **Task 6: Implement `src/components/game/QuestionOrder.test.tsx`**
  - [x] 7+ tests per AC #9 (skip keyboard reorder if too flaky in jsdom — note in spec)
  - [x] Tests pass

- [x] **Task 7: Full test + build verification**
  - [x] `npm test` all green
  - [x] `npm run build` clean
  - [x] Note new bundle size

- [x] **Task 8: Commit + push to main**
  - [x] Two commits (impl + spec)
  - [x] Fast-forward main, push, delete branch

## Dev Notes

### dnd-kit at a Glance

- **`@dnd-kit/core`** — `DndContext`, sensors (`PointerSensor`, `TouchSensor`, `KeyboardSensor`), `useSensor`, `useSensors`, drag event types
- **`@dnd-kit/sortable`** — `SortableContext`, `useSortable`, `verticalListSortingStrategy`, `arrayMove` utility
- **`@dnd-kit/utilities`** — `CSS.Transform.toString(transform)` for converting dnd-kit's transform value to a CSS transform string

Latest stable versions as of 2026-05:
- `@dnd-kit/core` ~6.x
- `@dnd-kit/sortable` ~8.x  
- `@dnd-kit/utilities` ~3.x

Note: `@dnd-kit/core` 6.x uses `Sensor` and `Modifier` APIs that are stable. No breaking changes expected before our deploy.

### Exact `src/lib/formatters.ts`

```typescript
import type { SpeedOrderFactor } from './schemas/question.schema';

/**
 * Formats a Speed Type A item's factor value for display in the post-submit reveal.
 * - 'price' → "$8.99" (USD currency)
 * - 'ABV' → "4.2% ABV"
 */
export function formatFactorValue(value: number, factor: SpeedOrderFactor): string {
  if (factor === 'price') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  }
  // 'ABV'
  return `${value.toFixed(1)}% ABV`;
}
```

### Exact `src/components/game/QuestionOrder.tsx`

```typescript
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { SpeedOrderQuestion } from '../../lib/schemas/question.schema';
import { defaultRng, type Rng } from '../../lib/rng';
import { pickRandomFromPool } from '../../lib/questionSelection';
import { formatFactorValue } from '../../lib/formatters';
import { useTimer } from '../../state/useTimer';
import { Button } from '../shared/Button';
import { ItemSquare, type ItemSquareVariant } from '../shared/ItemSquare';
import { TimerDisplay } from './TimerDisplay';
import { uiStrings } from '../../content/uiStrings';
import styles from './QuestionOrder.module.css';

export type QuestionOrderProps = {
  question: SpeedOrderQuestion;
  onAnswer: (isCorrect: boolean) => void;
  rng?: Rng;
  durationSeconds?: number;
  correctRevealMs?: number;
  wrongRevealMs?: number;
};

type Phase = 'idle' | 'revealed';

function isOrderCorrect(submittedNames: string[], canonical: SpeedOrderQuestion['items']): boolean {
  if (submittedNames.length !== canonical.length) return false;
  return submittedNames.every((name, i) => name === canonical[i]!.name);
}

export function QuestionOrder({
  question,
  onAnswer,
  rng = defaultRng,
  durationSeconds = 15,
  correctRevealMs = 1500,
  wrongRevealMs = 3000,
}: QuestionOrderProps) {
  // Initial shuffle — stable per mount.
  const [order, setOrder] = useState<string[]>(() => {
    const names = question.items.map((i) => i.name);
    return pickRandomFromPool(names, names.length, rng);
  });

  const [phase, setPhase] = useState<Phase>('idle');
  const [submittedCorrect, setSubmittedCorrect] = useState<boolean | null>(null);
  const dispatchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lookup: item name → factorValue for reveal subtext.
  const factorByName = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of question.items) map.set(item.name, item.factorValue);
    return map;
  }, [question]);

  // Lookup: item name → canonical-correct position.
  const canonicalIndexByName = useMemo(() => {
    const map = new Map<string, number>();
    question.items.forEach((item, i) => map.set(item.name, i));
    return map;
  }, [question]);

  // Cleanup any pending dispatch timer.
  useEffect(() => {
    return () => {
      if (dispatchTimerRef.current !== null) clearTimeout(dispatchTimerRef.current);
    };
  }, []);

  const handleSubmit = () => {
    if (phase !== 'idle') return;
    const correct = isOrderCorrect(order, question.items);
    setSubmittedCorrect(correct);
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (phase !== 'idle') return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrder((prev) => {
      const oldIndex = prev.indexOf(String(active.id));
      const newIndex = prev.indexOf(String(over.id));
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const itemVariantFor = (name: string, displayIndex: number): ItemSquareVariant => {
    if (phase === 'idle') return 'default';
    return canonicalIndexByName.get(name) === displayIndex ? 'revealed-correct' : 'revealed-wrong';
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.prompt}>{question.prompt}</h2>
      <TimerDisplay secondsRemaining={secondsRemaining} totalSeconds={durationSeconds} />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div className={styles.list}>
            {order.map((name, index) => (
              <SortableRow
                key={name}
                id={name}
                disabled={phase !== 'idle'}
                variant={itemVariantFor(name, index)}
                subtext={
                  phase === 'revealed'
                    ? formatFactorValue(factorByName.get(name) ?? 0, question.factor)
                    : undefined
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

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

function SortableRow({
  id,
  variant,
  subtext,
  disabled,
}: {
  id: string;
  variant: ItemSquareVariant;
  subtext: string | undefined;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const wrapperClass = [styles.row, isDragging ? styles.dragging : ''].filter(Boolean).join(' ');

  return (
    <button
      ref={setNodeRef}
      style={style}
      className={wrapperClass}
      disabled={disabled}
      data-row-name={id}
      {...attributes}
      {...listeners}
    >
      <ItemSquare text={id} variant={variant} subtext={subtext} />
    </button>
  );
}
```

### Exact `src/components/game/QuestionOrder.module.css`

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

.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.row {
  /* Wrapper for the sortable surface — ItemSquare provides the visual. */
  display: block;
  width: 100%;
  padding: 0;
  margin: 0;
  background: none;
  border: none;
  cursor: grab;
  /* dnd-kit applies transform via inline style; we add a settle transition. */
}

.row:active {
  cursor: grabbing;
}

.row:disabled {
  cursor: default;
}

.dragging {
  /* dnd-kit doesn't apply visual cues by default; we add a subtle lift. */
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  z-index: 10;
}

.submitRow {
  display: flex;
  justify-content: center;
  margin-top: var(--space-4);
}
```

### Exact `src/components/game/QuestionOrder.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { QuestionOrder } from './QuestionOrder';
import type { SpeedOrderQuestion } from '../../lib/schemas/question.schema';
import { uiStrings } from '../../content/uiStrings';

const fixturePriceQuestion: SpeedOrderQuestion = {
  prompt: 'Order from cheapest to most expensive',
  factor: 'price',
  items: [
    { name: 'A', factorValue: 1 },
    { name: 'B', factorValue: 2 },
    { name: 'C', factorValue: 3 },
  ],
  menuRefs: [],
};

const fixtureABVQuestion: SpeedOrderQuestion = {
  prompt: 'Order from lowest ABV to highest ABV',
  factor: 'ABV',
  items: [
    { name: 'Guinness', factorValue: 4.2 },
    { name: 'Bitburger', factorValue: 4.8 },
    { name: 'Fiddlehead', factorValue: 6.5 },
  ],
  menuRefs: [],
};

// Sync-zero props for fast tests (skip the reveal-delay timers).
const syncProps = { correctRevealMs: 0, wrongRevealMs: 0 };

// rng=()=>0.999 with Fisher-Yates on a 3-item array produces no swaps (identity order).
// This is the "canonical order" shuffle — useful for testing the "correct submit" path.
const identityRng = () => 0.999;

// rng=()=>0 reverses a 3-item array → [B, A, C] no wait let me trace... 
// pickRandomFromPool runs Fisher-Yates on a copy. For [A, B, C]:
//   i=2: j = Math.floor(0 * 3) = 0 → swap [0]↔[2] → [C, B, A]
//   i=1: j = Math.floor(0 * 2) = 0 → swap [0]↔[1] → [B, C, A]
// Result: [B, C, A]. NOT canonical → submit-as-is is wrong.
const reverseishRng = () => 0;

describe('QuestionOrder', () => {
  describe('default render', () => {
    it('renders the prompt', () => {
      render(<QuestionOrder question={fixturePriceQuestion} onAnswer={() => {}} rng={identityRng} {...syncProps} />);
      expect(screen.getByText(fixturePriceQuestion.prompt)).toBeTruthy();
    });

    it('renders all items as draggable rows', () => {
      render(<QuestionOrder question={fixturePriceQuestion} onAnswer={() => {}} rng={identityRng} {...syncProps} />);
      for (const item of fixturePriceQuestion.items) {
        expect(screen.getByText(item.name)).toBeTruthy();
      }
    });

    it('renders the LOCK IT IN button', () => {
      render(<QuestionOrder question={fixturePriceQuestion} onAnswer={() => {}} rng={identityRng} {...syncProps} />);
      expect(screen.getByRole('button', { name: uiStrings.buttons.lockIn })).toBeTruthy();
    });

    it('renders the timer progressbar', () => {
      render(<QuestionOrder question={fixturePriceQuestion} onAnswer={() => {}} rng={identityRng} {...syncProps} />);
      expect(screen.getByRole('progressbar', { name: 'Time remaining' })).toBeTruthy();
    });
  });

  describe('submit', () => {
    it('with canonical initial order (identity rng), LOCK IT IN → onAnswer(true)', async () => {
      const onAnswer = vi.fn();
      render(<QuestionOrder question={fixturePriceQuestion} onAnswer={onAnswer} rng={identityRng} {...syncProps} />);
      const lockBtn = screen.getByRole('button', { name: uiStrings.buttons.lockIn });
      // Use fireEvent.click since we're not testing user-event flow here.
      (lockBtn as HTMLButtonElement).click();
      expect(onAnswer).toHaveBeenCalledTimes(1);
      expect(onAnswer).toHaveBeenCalledWith(true);
    });

    it('with shuffled-not-canonical order, LOCK IT IN → onAnswer(false)', () => {
      const onAnswer = vi.fn();
      render(<QuestionOrder question={fixturePriceQuestion} onAnswer={onAnswer} rng={reverseishRng} {...syncProps} />);
      const lockBtn = screen.getByRole('button', { name: uiStrings.buttons.lockIn });
      (lockBtn as HTMLButtonElement).click();
      expect(onAnswer).toHaveBeenCalledTimes(1);
      expect(onAnswer).toHaveBeenCalledWith(false);
    });

    it('subsequent LOCK IT IN attempts after submission are ignored', () => {
      const onAnswer = vi.fn();
      render(<QuestionOrder question={fixturePriceQuestion} onAnswer={onAnswer} rng={identityRng} {...syncProps} />);
      const lockBtn = screen.getByRole('button', { name: uiStrings.buttons.lockIn });
      (lockBtn as HTMLButtonElement).click();
      // After submission, button unmounts; can't click it again. Verify it's gone.
      expect(screen.queryByRole('button', { name: uiStrings.buttons.lockIn })).toBeNull();
      expect(onAnswer).toHaveBeenCalledTimes(1);
    });
  });

  describe('post-submit reveal', () => {
    it('items render with reveal variants and factor subtext (price)', () => {
      const { container } = render(
        <QuestionOrder question={fixturePriceQuestion} onAnswer={() => {}} rng={identityRng} {...syncProps} />,
      );
      const lockBtn = screen.getByRole('button', { name: uiStrings.buttons.lockIn });
      (lockBtn as HTMLButtonElement).click();
      // Sync path (reveal=0) dispatches immediately — onAnswer already fired and React state changed phase.
      // ItemSquares should now have data-variant="revealed-*".
      const revealedItems = container.querySelectorAll('[data-variant^="revealed-"]');
      expect(revealedItems.length).toBe(fixturePriceQuestion.items.length);
      // Factor subtext appears.
      expect(screen.getByText('$1')).toBeTruthy();
      expect(screen.getByText('$2')).toBeTruthy();
      expect(screen.getByText('$3')).toBeTruthy();
    });

    it('ABV factor formatting in reveal subtext', () => {
      render(<QuestionOrder question={fixtureABVQuestion} onAnswer={() => {}} rng={identityRng} {...syncProps} />);
      const lockBtn = screen.getByRole('button', { name: uiStrings.buttons.lockIn });
      (lockBtn as HTMLButtonElement).click();
      expect(screen.getByText('4.2% ABV')).toBeTruthy();
      expect(screen.getByText('4.8% ABV')).toBeTruthy();
      expect(screen.getByText('6.5% ABV')).toBeTruthy();
    });
  });

  describe('timer expiry', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('auto-submits as wrong when the timer expires', () => {
      const onAnswer = vi.fn();
      // Pass durationSeconds=2 so we don't need to advance 15s of fake time.
      render(
        <QuestionOrder
          question={fixturePriceQuestion}
          onAnswer={onAnswer}
          rng={reverseishRng}
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

### Why `fireEvent.click` Instead of `userEvent.click` in Several Tests

Per recent stories (1.15 / 1.16 debug logs): `userEvent.click` v14 + fake timers + React 19 has a known deadlock. We use `fireEvent.click` for synchronous click flows in these tests. Some tests still use `userEvent` where there's no fake-timer interaction.

### Why Drag-Reorder via Keyboard Is NOT Heavily Tested Here

The AC mentions "drag-to-reorder via keyboard sensor (most testable)". In practice, dnd-kit's keyboard sensor in jsdom is brittle — it depends on element positioning (`getBoundingClientRect`) which jsdom approximates as zero. A test that calls `fireEvent.keyDown(item, { code: 'Space' })` to pick up, then arrow keys to move, may or may not actually reorder.

Approach: skip the explicit "drag via keyboard" test in QuestionOrder.test.tsx. Test the **outcome** (`isOrderCorrect` returns the right value for a given submitted order) via the submit-path tests. Story 2.8 (integration + production deploy) will manual-smoke the keyboard sensor on the live URL using a real browser.

If we want a deeper test of the reordering mechanism, do it at the integration layer (Story 2.8's manual smoke test) or via a dedicated Playwright/Cypress test (out of scope per NFR9).

### Common LLM Mistakes to Avoid

- **Do NOT** call `useTimer` BEFORE the dispatch timer ref state — order doesn't matter for correctness, but follow the Dev Notes order for readability
- **Do NOT** forget to pass `paused: phase !== 'idle'` to useTimer — otherwise the timer keeps ticking during the reveal phase and could fire onExpire after submission, double-dispatching
- **Do NOT** apply ItemSquare's `onClick` here — drag is the interaction, not tap. ItemSquare renders as `<div>` (no onClick); SortableRow wraps it in the focusable `<button>` with dnd-kit handlers
- **Do NOT** dispatch on every onDragEnd — onDragEnd just updates the local `order` state. Dispatch only fires on LOCK IT IN or timer expiry.
- **Do NOT** include the LOCK IT IN button in the SortableContext items list — it's not a sortable item
- **Do NOT** mutate `question.items` — it's the canonical reference. Use `factorByName` and `canonicalIndexByName` maps for lookups
- **Do NOT** call `onAnswer` from inside `handleDragEnd` — that's drag completion, not submission

### Test Pattern Notes

For sync-path tests (revealMs=0), `onAnswer` fires immediately on `(lockBtn).click()`. The state still transitions through 'revealed' before the dispatch (so subtext + reveal variants render), but it's all synchronous.

The reveal-variant assertion test uses sync path — at the moment we check `data-variant` attributes, the component is in revealed phase (state already updated), so the items have the revealed-* variant.

### Previous Story Intelligence

**From Story 1.13 (QuestionMC reveal pattern):**
- Two-phase state machine (idle → revealed) with timer-driven dispatch
- `dispatchTimerRef` for cleanup on unmount
- Sync path (duration ≤ 0) bypasses timers for fast tests

**From Story 2.4 (ItemSquare):**
- `data-variant` attribute for stable test selectors
- Renders as `<div>` (no onClick) → can be wrapped by external focusable element
- Subtext renders only in `revealed-*` variants when subtext prop provided

**From Story 2.5 (useTimer + TimerDisplay):**
- `useTimer({ onExpire, paused })` — pause during reveal phase
- TimerDisplay takes secondsRemaining + totalSeconds

**From Story 1.6 (questionSelection):**
- `pickRandomFromPool(items, items.length, rng)` shuffles in place via Fisher-Yates

### Git Intelligence

Last 4 commits on main:

```
b5f4b6a Add Story 2.5 dev spec to planning artifacts
528992c Story 2.5: useTimer hook + TimerDisplay component + shake variant
0c6077c Add Story 2.4 dev spec to planning artifacts
ffe1078 Story 2.4: ItemSquare shared primitive (Type A + Type B reuse)
```

Story 2.6 builds on `b5f4b6a`.

### Latest Tech Information

- **`@dnd-kit/core` 6.3.1** — current stable. PointerSensor, TouchSensor, KeyboardSensor all stable.
- **`@dnd-kit/sortable` 10.0.0** — current stable. `SortableContext`, `useSortable`, `arrayMove`, `sortableKeyboardCoordinates` all in 10.x.
- **`@dnd-kit/utilities` 3.2.2** — current stable. `CSS.Transform.toString` re-exported here.
- **React 19** — dnd-kit officially supports React 18+; verified compatible with React 19 in the wild.

### Project Structure Notes

**Alignment with architecture:**
- `src/components/game/QuestionOrder.tsx` ✓ (architecture line 396)
- `src/lib/formatters.ts` is NEW (not in architecture tree) — small utility module for factor value formatting. Acceptable addition.
- dnd-kit packages match architecture line 123

### References

- **Story source:** `_bmad-output/planning-artifacts/epics.md` § "Epic 2, Story 2.6"
- **PRD FRs:** FR12 (3-5 items), FR13 (price/ABV factors), FR14 (touch + mouse interaction), FR15 (15s timer), FR16 (Submit button), FR17 (expiry = wrong), FR18 (post-submit reveal factor values + scoring)
- **Architecture:** §"Drag-and-Drop Pattern" line 308 (dnd-kit choice + sensors), §"Frontend Architecture" line 123
- **UX:** §"The Three-Beat Loop", §"Implementation Approach" line 402 (Type A layout)
- **Previous stories:** 1-13 (reveal pattern), 1-15 (GameScreen integration target), 2.1 (content), 2.4 (ItemSquare), 2.5 (useTimer + TimerDisplay)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code)

### Debug Log References

None — type-check clean on first compile; 16 new tests all passed on first run. Per the spec, the keyboard-reorder dnd-kit test was deferred to Story 2.8's manual smoke test.

### Completion Notes List

- **Installed dnd-kit packages:** `@dnd-kit/core@6.3.1`, `@dnd-kit/sortable@10.0.0`, `@dnd-kit/utilities@3.2.2`. No `--legacy-peer-deps` needed.
- **`src/lib/formatters.ts`** — pure `formatFactorValue(value, factor)` using `Intl.NumberFormat` for price and a simple template for ABV. 6 tests (3 price + 3 ABV).
- **`src/components/game/QuestionOrder.tsx`** — DndContext + 3 sensors (PointerSensor, TouchSensor, KeyboardSensor with sortableKeyboardCoordinates). SortableContext with verticalListSortingStrategy. Two-phase reveal pattern (idle → revealed → onAnswer) mirroring QuestionMC. Timer integration with `paused: phase !== 'idle'`. Each item renders via SortableRow (focusable button wrapper) containing an ItemSquare.
- **10 tests** cover default render (4), submit-correct/wrong/ignored (3), post-submit reveal with price + ABV factor formatting (2), timer expiry (1).
- **Test count: 256** (was 240 → +16). Build clean. **Bundle unchanged at 468.50 / 138.90 kB** — QuestionOrder + dnd-kit tree-shaken until Story 2.8's integration pulls them in. Once wired, dnd-kit runtime should add ~15-25 kB gzip.

### File List

- **NEW** `src/lib/formatters.ts`
- **NEW** `src/lib/formatters.test.ts`
- **NEW** `src/components/game/QuestionOrder.tsx`
- **NEW** `src/components/game/QuestionOrder.module.css`
- **NEW** `src/components/game/QuestionOrder.test.tsx`
- **MODIFIED** `package.json` (added @dnd-kit/core ^6.3.1, @dnd-kit/sortable ^10.0.0, @dnd-kit/utilities ^3.2.2)
- **MODIFIED** `package-lock.json`

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-24 | Story created. Installs dnd-kit deps (deferred from Story 1.1), implements QuestionOrder with SortableContext + 3 sensors, two-phase reveal pattern (matching QuestionMC), timer integration. Test strategy notes: keyboard-reorder dnd-kit testing is brittle in jsdom — defer to integration smoke test in Story 2.8. | bmad-create-story (Claude Opus 4.7) |
| 2026-05-24 | Story shipped. dnd-kit installed cleanly; 16 new tests pass on first run. Bundle unchanged — tree-shaken until Story 2.8 integration. | bmad-dev-story (Claude Opus 4.7) |
