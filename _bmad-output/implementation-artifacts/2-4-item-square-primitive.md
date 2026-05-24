# Story 2.4: ItemSquare Shared Primitive

Status: review

## Story

As a developer,
I want a reusable `<ItemSquare>` primitive that QuestionOrder (Type A drag rows) and QuestionSelect (Type B selectable grid) can both compose,
so that the visual treatment of menu items in speed rounds is consistent and each speed-type component can focus on its interaction model instead of styling.

## Acceptance Criteria

1. **`src/components/shared/ItemSquare.tsx` exists with this contract:**
   - Props: `{ text: string; variant?: ItemSquareVariant; subtext?: string; onClick?: () => void; disabled?: boolean; ariaPressed?: boolean }`
   - `ItemSquareVariant` = `'default' | 'selected' | 'revealed-correct' | 'revealed-wrong' | 'revealed-missed'`
   - `variant` defaults to `'default'`
   - **Renders as `<button>` when `onClick` is provided, otherwise as `<div>`** (so QuestionOrder can wrap a div in dnd-kit's own button; QuestionSelect makes the square itself the button)

2. **Visual treatments per variant** (CSS Module, all design tokens):
   - `default` — neutral bg (`--color-bg-accent`), no outline
   - `selected` — gold outline (`--color-brand-primary`, 4px), scale 1.02 (matches MC `locked` state for consistency)
   - `revealed-correct` — green outline (`--color-state-success`, 4px), scale 1.02, subtext rendered
   - `revealed-wrong` — red outline (`--color-state-error`, 4px), scale 1.02, subtext rendered
   - `revealed-missed` — dashed green outline (`--color-state-success`), no scale; signals "this was correct but you didn't pick it" (Type B only)

3. **`subtext` rendering:**
   - Shown only in `revealed-*` variants when the prop is provided (used for Type A's factor-value reveal like `"$8.99"`)
   - Rendered beneath `text` in smaller, muted styling
   - Absent (no element rendered) in `default` / `selected` variants

4. **Layout defaults:**
   - Flex column, items centered, text-align center
   - `min-height: 80px` (UX spec: ≥80×80pt for Type B; Type A rows can override via parent CSS to be taller/wider)
   - Padding via `--space-4`
   - Rounded `--radius-lg`
   - Font family `--font-ui`, weight bold, size `--text-md`

5. **Accessibility:**
   - When rendered as `<button>` (onClick provided), `ariaPressed` prop forwards to `aria-pressed` for toggle-style selectable squares
   - When rendered as `<div>`, no role/aria-* added by this component — caller (e.g., QuestionOrder's dnd-kit wrapper) handles semantics
   - `disabled` prop suppresses click + sets visual disabled state (lowered opacity, `cursor: not-allowed`)

6. **Test stability:**
   - Root element has `data-variant` attribute matching the current variant (e.g., `data-variant="selected"`)
   - Lets tests assert state without coupling to CSS class names (pattern from QuestionMC)

7. **`ItemSquare.test.tsx` covers:**
   - Renders the `text` prop
   - All 5 variants set the correct `data-variant` attribute
   - `subtext` renders in revealed variants when provided
   - `subtext` does NOT render in `default` / `selected` variants
   - With `onClick`: renders as `<button>` and click fires the handler
   - Without `onClick`: renders as `<div>` (no implicit button element)
   - `disabled` suppresses click invocation (button only)
   - `ariaPressed` forwards correctly to the button

8. **Build + tests pass:**
   - `npm test` exit 0 (207 prior + new tests)
   - `npm run build` clean
   - Bundle unchanged — ItemSquare tree-shaken until Stories 2.6/2.7 consume it

## Tasks / Subtasks

- [x] **Task 1: Pre-work safety check**
  - [x] Working tree clean; on `main`; up to date
  - [x] Confirm 207 tests pass
  - [x] Create branch `story/2-4-item-square`

- [x] **Task 2: Implement `src/components/shared/ItemSquare.tsx`**
  - [x] File per Dev Notes — conditional `<button>` vs `<div>`, variant-driven className composition
  - [x] Type-check clean

- [x] **Task 3: Implement `src/components/shared/ItemSquare.module.css`**
  - [x] Container base + 5 variant classes + subtext class
  - [x] Design tokens via `var(--...)` throughout

- [x] **Task 4: Implement `src/components/shared/ItemSquare.test.tsx`**
  - [x] 8+ tests per AC #7
  - [x] Tests pass

- [x] **Task 5: Full test + build**
  - [x] `npm test` green
  - [x] `npm run build` clean

- [x] **Task 6: Commit + push to main**
  - [x] Two commits (impl + spec)
  - [x] Fast-forward main, push, delete branch

## Dev Notes

### Why the Conditional `<button>` vs `<div>` Element

Speed Type B (QuestionSelect, Story 2.7) needs each square to be a tappable button — natural semantics. The `onClick` prop on ItemSquare drives this: provide it → `<button>`.

Speed Type A (QuestionOrder, Story 2.6) wraps each item in dnd-kit's `useSortable` which expects to apply drag attributes + listeners to a focusable element. The typical dnd-kit pattern wraps the sortable item in its OWN `<button>` (so the keyboard sensor works), with the visual element inside. ItemSquare-as-div lets QuestionOrder do:

```tsx
const { attributes, listeners, setNodeRef } = useSortable({ id });
return (
  <button ref={setNodeRef} {...attributes} {...listeners} className={dragWrapperClass}>
    <ItemSquare text={item.name} variant="default" />
  </button>
);
```

ItemSquare stays pure visual; QuestionOrder owns the interaction wrapper.

### Exact `src/components/shared/ItemSquare.tsx`

```typescript
import styles from './ItemSquare.module.css';

export type ItemSquareVariant =
  | 'default'
  | 'selected'
  | 'revealed-correct'
  | 'revealed-wrong'
  | 'revealed-missed';

export type ItemSquareProps = {
  text: string;
  variant?: ItemSquareVariant;
  /** Shown beneath text in revealed-* variants (e.g., "$8.99" for Type A reveal). */
  subtext?: string;
  /** When provided, renders as <button>; when omitted, renders as <div>. */
  onClick?: () => void;
  disabled?: boolean;
  /** For toggle-style selectable squares (Type B). Only meaningful when onClick is provided. */
  ariaPressed?: boolean;
};

function variantClassKey(variant: ItemSquareVariant): keyof typeof styles {
  switch (variant) {
    case 'default':           return 'default';
    case 'selected':          return 'selected';
    case 'revealed-correct':  return 'revealedCorrect';
    case 'revealed-wrong':    return 'revealedWrong';
    case 'revealed-missed':   return 'revealedMissed';
  }
}

const REVEALED_VARIANTS = new Set<ItemSquareVariant>([
  'revealed-correct',
  'revealed-wrong',
  'revealed-missed',
]);

export function ItemSquare({
  text,
  variant = 'default',
  subtext,
  onClick,
  disabled = false,
  ariaPressed,
}: ItemSquareProps) {
  const className = [styles.container, styles[variantClassKey(variant)]].join(' ');
  const showSubtext = subtext !== undefined && REVEALED_VARIANTS.has(variant);

  const content = (
    <>
      <span className={styles.text}>{text}</span>
      {showSubtext && <span className={styles.subtext}>{subtext}</span>}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={className}
        onClick={onClick}
        disabled={disabled}
        aria-pressed={ariaPressed}
        data-variant={variant}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={className} data-variant={variant}>
      {content}
    </div>
  );
}
```

### Exact `src/components/shared/ItemSquare.module.css`

```css
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  min-height: 80px;
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  background-color: var(--color-bg-accent);
  color: var(--color-text-primary);
  font-family: var(--font-ui);
  font-size: var(--text-md);
  font-weight: var(--font-weight-bold);
  text-align: center;
  border: none;
  transition:
    transform var(--motion-fast) var(--ease-snappy),
    opacity var(--motion-base) var(--ease-snappy);
  cursor: pointer;
}

/* When rendered as <div> (no onClick), no pointer cursor. */
div.container {
  cursor: default;
}

.container:active:not(:disabled) {
  transform: scale(0.98);
}

.container:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.default {
  /* base styling already set on .container */
}

.selected {
  outline: 4px solid var(--color-brand-primary);
  outline-offset: -4px;
  transform: scale(1.02);
  z-index: 1;
}

.revealedCorrect {
  outline: 4px solid var(--color-state-success);
  outline-offset: -4px;
  transform: scale(1.02);
  z-index: 1;
}

.revealedWrong {
  outline: 4px solid var(--color-state-error);
  outline-offset: -4px;
  transform: scale(1.02);
  z-index: 1;
}

.revealedMissed {
  outline: 3px dashed var(--color-state-success);
  outline-offset: -3px;
  opacity: 0.7;
}

.text {
  /* primary text already gets container font sizing */
}

.subtext {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}
```

### Exact `src/components/shared/ItemSquare.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ItemSquare, type ItemSquareVariant } from './ItemSquare';

describe('ItemSquare', () => {
  it('renders the text prop', () => {
    render(<ItemSquare text="House Salad" />);
    expect(screen.getByText('House Salad')).toBeTruthy();
  });

  describe('variants', () => {
    const variants: ItemSquareVariant[] = [
      'default',
      'selected',
      'revealed-correct',
      'revealed-wrong',
      'revealed-missed',
    ];

    for (const variant of variants) {
      it(`sets data-variant="${variant}"`, () => {
        const { container } = render(<ItemSquare text="X" variant={variant} />);
        const root = container.querySelector('[data-variant]');
        expect(root).toBeTruthy();
        expect(root?.getAttribute('data-variant')).toBe(variant);
      });
    }
  });

  describe('subtext', () => {
    it('renders subtext in revealed-correct variant', () => {
      render(<ItemSquare text="Item" variant="revealed-correct" subtext="$8.99" />);
      expect(screen.getByText('$8.99')).toBeTruthy();
    });

    it('renders subtext in revealed-wrong variant', () => {
      render(<ItemSquare text="Item" variant="revealed-wrong" subtext="$5.00" />);
      expect(screen.getByText('$5.00')).toBeTruthy();
    });

    it('renders subtext in revealed-missed variant', () => {
      render(<ItemSquare text="Item" variant="revealed-missed" subtext="$10" />);
      expect(screen.getByText('$10')).toBeTruthy();
    });

    it('does NOT render subtext in default variant', () => {
      render(<ItemSquare text="Item" variant="default" subtext="$8.99" />);
      expect(screen.queryByText('$8.99')).toBeNull();
    });

    it('does NOT render subtext in selected variant', () => {
      render(<ItemSquare text="Item" variant="selected" subtext="$8.99" />);
      expect(screen.queryByText('$8.99')).toBeNull();
    });
  });

  describe('element type', () => {
    it('renders as <button> when onClick is provided', () => {
      render(<ItemSquare text="X" onClick={() => {}} />);
      expect(screen.getByRole('button', { name: 'X' })).toBeTruthy();
    });

    it('renders as <div> when onClick is omitted', () => {
      render(<ItemSquare text="X" />);
      expect(screen.queryByRole('button')).toBeNull();
    });
  });

  describe('interaction', () => {
    it('calls onClick when the button is tapped', async () => {
      const onClick = vi.fn();
      render(<ItemSquare text="X" onClick={onClick} />);
      await userEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledOnce();
    });

    it('does NOT call onClick when disabled', async () => {
      const onClick = vi.fn();
      render(<ItemSquare text="X" onClick={onClick} disabled />);
      await userEvent.click(screen.getByRole('button'));
      expect(onClick).not.toHaveBeenCalled();
    });

    it('forwards ariaPressed to the button when provided', () => {
      render(<ItemSquare text="X" onClick={() => {}} ariaPressed />);
      expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('true');
    });
  });
});
```

### Common LLM Mistakes to Avoid

- **Do NOT** import dnd-kit in ItemSquare — it's a pure visual primitive; QuestionOrder (Story 2.6) wraps it for drag behavior
- **Do NOT** hardcode any colors, sizes, or animation timings — every CSS value via `var(--token)`
- **Do NOT** render the subtext element when subtext prop is absent — emit nothing (avoid empty `<span>`)
- **Do NOT** add a default `aria-label` — the visible text is the accessible name
- **Do NOT** put any speed-round-specific logic in here (factor formatting, set comparison, etc.) — that's the parent component's concern
- **Do NOT** use a custom Motion variant for the reveal entrance — CSS transitions on outline/scale are enough; if Stories 2.6/2.7 want richer entrance animation, they can wrap ItemSquare in `motion.div` themselves
- **Do NOT** set a max-width or fixed width — caller's grid/row layout decides

### Testing Standards

- Vitest + jsdom (configured)
- `render` + `screen` + `userEvent`
- Query by `data-variant` attribute for state assertions (decoupled from CSS class names)
- `queryByText` for "should not exist" assertions, `getByText` for positive

### Previous Story Intelligence

**From Story 1.9 (Button shared primitive):**
- CSS Module pattern with design tokens via `var(--...)`
- Disabled state: lowered opacity + `cursor: not-allowed` + native `disabled` attribute
- `data-*` attributes for test stability
- ItemSquare follows the same conventions

**From Story 1.13 (QuestionMC):**
- `data-quadrant-state` pattern for variant assertion in tests
- ItemSquare uses the same `data-variant` pattern

**From recent MC reveal fix:**
- Outline-only reveal styling (5px outline + 1.04 scale on QuestionMC's correct state). ItemSquare uses similar 4px outline + 1.02 scale for visual family consistency.

### Git Intelligence

Last 4 commits on main:

```
814d0e8 Add Story 2.3 dev spec to planning artifacts
91efd9b Story 2.3: extend schemas + reducer + question selection (+ fix latent Epic 1 bug)
b1359b0 Add Story 2.2 dev spec to planning artifacts
9726cbe Story 2.2: Author 40 Speed Type B (multi-select) questions
```

Story 2.4 builds on `814d0e8`.

### Latest Tech Information

No new dependencies. Reuses React, CSS Modules, Vitest + RTL.

### Project Structure Notes

**Alignment with architecture:**
- `src/components/shared/ItemSquare.tsx` + `.module.css` + `.test.tsx` ✓ (architecture lines 407-408)
- Pure presentational; consumed by Stories 2.6 (QuestionOrder) and 2.7 (QuestionSelect)

### References

- **Story source:** `_bmad-output/planning-artifacts/epics.md` § "Epic 2, Story 2.4"
- **PRD FRs (visual rules):** FR12 / FR19 (item content), FR22 (Type B select/deselect — relevant for `selected` variant), FR24 (post-submit reveal — relevant for `revealed-*` variants)
- **UX:** §"Touch Target Patterns" (Speed B squares ≥80×80pt, Type A rows are draggable), §"QuestionMC reveal states" (parallel pattern for ItemSquare's reveal variants)
- **Previous stories:** 1-9 (Button conventions), 1-13 (data-variant test pattern)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code)

### Debug Log References

None — all tests passed on first run.

### Completion Notes List

- `src/components/shared/ItemSquare.tsx` (~50 lines) — pure presentational primitive with 5 variants (`default` / `selected` / `revealed-correct` / `revealed-wrong` / `revealed-missed`).
- Renders as `<button>` when `onClick` is provided, `<div>` otherwise. Lets QuestionOrder (Story 2.6) wrap in dnd-kit's own button while QuestionSelect (Story 2.7) uses the square itself as the tap target.
- `subtext` prop renders only in revealed variants (used for Type A's factor-value reveal like `"$8.99"`); absent in default/selected.
- `data-variant` attribute on root for stable test selectors (pattern from QuestionMC).
- Visual consistency with MC reveal styling: 4px outline + 1.02 scale (vs QuestionMC's 5px + 1.04 for the dominant correct answer).
- 16 tests pass: text render, 5 variant data-attributes, 5 subtext visibility (3 revealed + 2 non-revealed), 2 element-type (button/div), 3 interaction (click, disabled-suppression, aria-pressed forwarding).
- **Test count: 223** (was 207 → +16).
- **Bundle: 468.50 / 138.90 kB — unchanged.** ItemSquare tree-shaken until Story 2.6/2.7 consume it.

### File List

- **NEW** `src/components/shared/ItemSquare.tsx`
- **NEW** `src/components/shared/ItemSquare.module.css`
- **NEW** `src/components/shared/ItemSquare.test.tsx`

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-24 | Story created. Pure presentational ItemSquare with 5 variants (default / selected / revealed-correct / revealed-wrong / revealed-missed) and conditional element type (button if onClick, else div) so QuestionOrder can wrap in dnd-kit's button while QuestionSelect uses the square itself as the tap target. | bmad-create-story (Claude Opus 4.7) |
| 2026-05-24 | Story implemented and shipped. 16 tests pass on first run. Bundle unchanged — tree-shaken until Stories 2.6/2.7 consume it. | bmad-dev-story (Claude Opus 4.7) |
