# Story 1.12: Hint Button

Status: review

## Story

As a player,
I want a Hint button on MC questions that lets me trade points for an easier choice,
so that I have a real decision to make on harder questions.

## Acceptance Criteria

1. **`src/components/game/HintButton.tsx` exists:**
   - Props: `{ onUse: () => void; disabled?: boolean }`
   - Renders the secondary-style pill (≥44pt) from Story 1.9's `<Button variant="secondary">` with the label from `uiStrings.buttons.hint` (`'💡 Hint'`)
   - Forwards `aria-label="Hint"` so screen readers announce a clean word (the emoji + word combo can read awkwardly)
   - Decoupled from the reducer: parent reads `state.usedHintThisQuestion` and passes `disabled`; parent wires `onUse` to `helpers.useHint()`

2. **Tapping the button calls `onUse` exactly once:**
   - The underlying `<Button>` already handles the click event; HintButton just forwards `onClick={onUse}`

3. **Disabled state prevents further taps:**
   - When `disabled={true}` (i.e., hint already used this question), the button is visually disabled (the `<Button>` component already lowers opacity + sets `cursor: not-allowed` + sets the `disabled` attribute)
   - Clicking the disabled button does NOT call `onUse`

4. **`HintButton.test.tsx` covers:**
   - Renders with the `'💡 Hint'` label from uiStrings
   - Forwards the `aria-label="Hint"`
   - Tapping the enabled button calls `onUse` exactly once
   - Tapping the disabled button does NOT call `onUse`

5. **Build + tests pass:**
   - `npm test` exit 0 (130 prior + 4 new)
   - `npm run build` clean
   - Live site unchanged (HintButton not yet mounted — Story 1.13's QuestionMC mounts it; Story 1.15/1.16 puts that on the live page)

## Tasks / Subtasks

- [x] **Task 1: Pre-work safety check**
  - [x] Working tree clean; on `main`; up to date
  - [x] Verify Story 1.11 in place: `src/components/game/ScoreDisplay.tsx`; 130 tests pass
  - [x] Create branch `story/1-12-hint-button`

- [x] **Task 2: Implement `src/components/game/HintButton.tsx`**
  - [x] File per Dev Notes — wraps `<Button variant="secondary">`, forwards `aria-label="Hint"`
  - [x] Type-check clean: `npx tsc --noEmit`

- [x] **Task 3: Implement `src/components/game/HintButton.test.tsx`**
  - [x] 4 tests per AC #4
  - [x] Tests pass

- [x] **Task 4: Full test + build + ship**
  - [x] `npm test` all green
  - [x] `npm run build` clean
  - [x] Two commits (src + spec), fast-forward `main`, push, delete branch

## Dev Notes

### Why HintButton is a thin wrapper, not a from-scratch component

The Button primitive from Story 1.9 already provides:
- ≥44pt secondary pill styling (`<Button variant="secondary">`)
- Disabled visual state (lowered opacity, `cursor: not-allowed`, `disabled` attribute on the underlying `<button>`)
- Click-suppression when disabled (browser default for `<button disabled>`)
- `aria-label` forwarding

HintButton adds: the specific label string, the explicit aria-label, and a semantic name in the component tree. It's a 15-line component. That's the right size — keeps callsites readable (`<HintButton onUse={helpers.useHint} disabled={state.usedHintThisQuestion} />`) without scattering UI strings across components.

### Why no `HintButton.module.css`

Architecture line 394 lists `HintButton.module.css` in the file tree. We're not creating it: HintButton has no styling of its own — it's a thin Button wrapper. An empty `.module.css` would be noise. Layout (bottom-center positioning on the MC question screen) is the parent's job (QuestionMC, Story 1.13, or GameScreen, Story 1.15+). **Acceptable deviation from architecture; documented here.**

### Exact `src/components/game/HintButton.tsx`

```typescript
import { Button } from '../shared/Button';
import { uiStrings } from '../../content/uiStrings';

export type HintButtonProps = {
  onUse: () => void;
  disabled?: boolean;
};

export function HintButton({ onUse, disabled = false }: HintButtonProps) {
  return (
    <Button
      variant="secondary"
      onClick={onUse}
      disabled={disabled}
      aria-label="Hint"
    >
      {uiStrings.buttons.hint}
    </Button>
  );
}
```

### Exact `src/components/game/HintButton.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HintButton } from './HintButton';
import { uiStrings } from '../../content/uiStrings';

describe('HintButton', () => {
  it('renders the hint label from uiStrings', () => {
    render(<HintButton onUse={() => {}} />);
    // Query by accessible name — RTL resolves to the aria-label since one is set.
    expect(screen.getByRole('button', { name: 'Hint' })).toBeTruthy();
    // Visible text content includes the emoji label.
    expect(screen.getByText(uiStrings.buttons.hint)).toBeTruthy();
  });

  it('forwards aria-label="Hint"', () => {
    render(<HintButton onUse={() => {}} />);
    expect(screen.getByRole('button').getAttribute('aria-label')).toBe('Hint');
  });

  it('calls onUse exactly once when the enabled button is tapped', async () => {
    const onUse = vi.fn();
    render(<HintButton onUse={onUse} />);
    await userEvent.click(screen.getByRole('button', { name: 'Hint' }));
    expect(onUse).toHaveBeenCalledOnce();
  });

  it('does NOT call onUse when the disabled button is tapped', async () => {
    const onUse = vi.fn();
    render(<HintButton onUse={onUse} disabled />);
    await userEvent.click(screen.getByRole('button', { name: 'Hint' }));
    expect(onUse).not.toHaveBeenCalled();
  });
});
```

### Common LLM Mistakes to Avoid

- **Do NOT** create `HintButton.module.css` — no styling of its own; would be empty noise
- **Do NOT** hardcode `'💡 Hint'` in the component — pull from `uiStrings.buttons.hint`
- **Do NOT** position the button (no `position: absolute`, no bottom anchors) — that's the parent's responsibility
- **Do NOT** wire HintButton to `useGameState` — keep it decoupled; parent reads state and passes `disabled` + `onUse` callback
- **Do NOT** add an extra wrapper `<div>` — the bare `<Button>` IS the component
- **Do NOT** add `aria-pressed` or `aria-disabled` — `disabled` attribute on the underlying `<button>` is the accessible truth
- **Do NOT** add a toast or popup explaining "Hint used" — UX spec rejects that pattern; the disabled state is the feedback

### Previous Story Intelligence

**From Story 1.9 (Button + uiStrings):**
- `<Button variant="secondary">` is the ≥44pt pill with `--color-bg-accent` background and `--color-text-primary` text
- Button accepts `aria-label` prop and forwards to the underlying `<button>`
- `uiStrings.buttons.hint` = `'💡 Hint'`

**From Story 1.10/1.11 (component patterns):**
- Components decoupled from reducer via props (`onStart`, `score`, etc.)
- HintButton follows: `onUse` callback, `disabled` flag

### Git Intelligence

Last 4 commits on main:

```
06a411a Add Story 1.11 dev spec to planning artifacts
9320fcb Story 1.11: ScoreDisplay — count-up animation via Motion animate()
f7fcf8a Add Story 1.10 dev spec to planning artifacts
0d02d27 Story 1.10: StartScreen — wordmark + random pre-game message + START GAME
```

Story 1.12 builds on `06a411a`.

### Latest Tech Information

No new libraries or APIs needed. Reuses existing `Button`, `uiStrings`, RTL test patterns.

### Project Structure Notes

**Alignment with architecture:**
- `src/components/game/HintButton.tsx` ✓ (architecture line 393)
- `src/components/game/HintButton.test.tsx` ✓ (line 395)
- `HintButton.module.css` ✗ — intentional deviation; documented in Dev Notes

### References

- **Story source:** `_bmad-output/planning-artifacts/epics.md` § "Epic 1, Story 1.12"
- **PRD FRs:** FR25 (Hint visible on MC), FR26 (NOT on speed rounds), FR27 (greys out one wrong — handled by QuestionMC in Story 1.13), FR28 (once per question), FR29 (alters scoring — handled by `scoring.ts`/`gameReducer.ts`)
- **Architecture:** §"Requirements → File Mapping" (F5)
- **UX:** §"Button Hierarchy" — secondary pill ≥44pt
- **Previous stories:** 1-8 (reducer USE_HINT), 1-9 (Button + uiStrings), 1-11 (component patterns)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code)

### Debug Log References

None — thinnest component shipped so far; spec exactly as written.

### Completion Notes List

- `src/components/game/HintButton.tsx` — 15 lines; wraps `<Button variant="secondary">` with the `'💡 Hint'` label from `uiStrings`, forwards explicit `aria-label="Hint"` so screen readers announce cleanly.
- Decoupled from reducer: parent will read `state.usedHintThisQuestion` and pass `disabled` + wire `onUse` to `helpers.useHint()`.
- No `HintButton.module.css` — intentional deviation from architecture file tree; would be empty noise. Layout is the parent's job.
- 4 tests pass: hint label, aria-label, click invokes onUse, disabled suppresses click.
- **Test count: 134** (was 130 → +4).
- **Bundle: 194.36 kB / gzip 61.24 kB — unchanged.** Tree-shaken until Story 1.13's QuestionMC imports it.

### File List

- **NEW** `src/components/game/HintButton.tsx`
- **NEW** `src/components/game/HintButton.test.tsx`

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-23 | Story created. Thin wrapper over Button variant=secondary with hint label + explicit aria-label. Decoupled from reducer. No module.css (intentional deviation from architecture tree). | bmad-create-story (Claude Opus 4.7) |
| 2026-05-23 | Story implemented and shipped. 134 tests pass (130 prior + 4 new). Bundle unchanged — tree-shaken until QuestionMC consumes it. | bmad-dev-story (Claude Opus 4.7) |
