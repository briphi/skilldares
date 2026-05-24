# Story 1.11: Score Display

Status: review

## Story

As a player,
I want my running score visible in the upper-right at all times during play, with the number animating count-up when points are awarded,
so that I can see how I'm doing without leaving the question and feel a small dopamine hit on every correct answer.

## Acceptance Criteria

1. **`src/components/game/ScoreDisplay.tsx` exists:**
   - Single prop: `{ score: number }`
   - Renders "Score: " label + the numeric value
   - Self-contained: does NOT know about GameScreen header layout (parent component places it in the upper-right via container CSS)

2. **Count-up animation on score change (FR35):**
   - When `score` prop transitions from N to M (M > N or M ≠ N), the displayed integer animates from N to M
   - Uses the existing `countUp` Transition from `src/lib/motionVariants.ts` (`--motion-base` / 0.25s, `EASE_BOUNCE` cubic-bezier)
   - Implemented via Motion's imperative `animate()` function — NOT via the `animate` prop (we're tweening a number, not a CSS property)
   - The animation runs as a side effect (useEffect); on unmount or score-change-mid-animation, the previous animation is `.stop()`'d in the cleanup function

3. **No animation when score is unchanged:**
   - Initial mount with score=5 → displayed=5, no animation runs
   - Re-render with the same score value → no animation runs, displayed value unchanged synchronously

4. **Non-blocking:**
   - Component renders as a `<div>` with text — no overlays, no `pointer-events: none` traps, no full-screen wrappers
   - Other UI elements remain interactive throughout the animation (this is implicit from a simple text component)

5. **Styling via `ScoreDisplay.module.css`:**
   - All values via design tokens (`var(--...)`) — no hardcoded colors/sizes
   - Display font for the numeric value (`--font-display`), body font for the "Score:" label
   - Right-aligned text so the component sits cleanly in the upper-right when the parent positions it there
   - Number uses `--color-text-primary`; label uses `--color-text-muted`

6. **Accessibility:**
   - Outer element has `aria-live="polite"` + `aria-atomic="true"` so screen readers announce score updates without interrupting
   - The "Score:" text and the number are part of the same announcement

7. **`ScoreDisplay.test.tsx` covers:**
   - Initial render shows "Score: 0" (or whatever initial value passed)
   - When `score` prop changes, the displayed text eventually equals the new score (use `waitFor`)
   - When `score` prop is re-passed unchanged via rerender, the displayed text remains unchanged synchronously
   - `aria-live="polite"` attribute is present

8. **Build + tests pass:**
   - `npm test` exit 0
   - `npm run build` clean
   - Bundle size noted in completion notes (Motion's `animate()` finally gets a real import — expect a few kB)
   - Live site at `https://www.skilldares.com/` continues to render the Vite scaffold (ScoreDisplay isn't mounted yet — Story 1.15/1.16 puts it in GameScreen)

## Tasks / Subtasks

- [x] **Task 1: Pre-work safety check**
  - [x] Working tree clean
  - [x] On `main`, up to date with `origin/main`
  - [x] Verify Story 1.10 in place: `src/components/start/StartScreen.tsx`; `npm test` shows 125 passing
  - [x] Create feature branch `story/1-11-score-display`

- [x] **Task 2: Implement `src/components/game/ScoreDisplay.tsx`**
  - [x] Create `src/components/game/` directory
  - [x] File per Dev Notes (useState for displayed, useEffect with `animate()` from `motion/react`, spread `countUp` into options, `onUpdate` to setDisplayed)
  - [x] Type-check clean: `npx tsc --noEmit`

- [x] **Task 3: Implement `src/components/game/ScoreDisplay.module.css`**
  - [x] Per Dev Notes — right-aligned, display font for the number, design tokens throughout

- [x] **Task 4: Implement `src/components/game/ScoreDisplay.test.tsx`**
  - [x] 4 tests per AC #7
  - [x] All pass: `npx vitest run src/components/game/ScoreDisplay.test.tsx`

- [x] **Task 5: Full test suite + build verification**
  - [x] `npm test` all green (125 prior + 4 new)
  - [x] `npm run build` clean; note new bundle size (Motion runtime now genuinely imported)

- [x] **Task 6: Commit + push + verify deploy**
  - [x] Two commits per established pattern (src then spec)
  - [x] Fast-forward main, push, delete branch
  - [x] Verify Amplify build clean; live site unchanged (ScoreDisplay not yet mounted)

## Dev Notes

### Why Motion's imperative `animate()` and not the `animate` prop

The `animate` prop on `motion.span` tweens CSS properties (`opacity`, `transform`, etc.). We're tweening a **number that drives text content** — not a CSS property. The imperative `animate(from, to, options)` function is the right tool: it owns the tween, fires `onUpdate(value)` on every frame, and we call `setDisplayed(Math.round(value))` to project it into the DOM as text.

```typescript
import { animate } from 'motion/react';
animate(0, 5, { duration: 0.25, ease: [...], onUpdate: (v) => ... });
```

The `countUp` Transition from `src/lib/motionVariants.ts` has `{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }` — we spread it into `animate()`'s options.

### Exact `src/components/game/ScoreDisplay.tsx`

```typescript
import { useEffect, useState } from 'react';
import { animate } from 'motion/react';
import { countUp } from '../../lib/motionVariants';
import styles from './ScoreDisplay.module.css';

export type ScoreDisplayProps = {
  score: number;
};

export function ScoreDisplay({ score }: ScoreDisplayProps) {
  const [displayed, setDisplayed] = useState<number>(score);

  useEffect(() => {
    // Snapshot the current displayed value so the effect doesn't restart
    // when setDisplayed fires inside onUpdate (which would create an
    // animation loop).
    setDisplayed((current) => {
      if (current === score) return current;
      const controls = animate(current, score, {
        ...countUp,
        onUpdate: (v) => setDisplayed(Math.round(v)),
      });
      // The effect's cleanup function captures `controls` via the outer closure;
      // see the return below.
      _activeControls = controls;
      return current;
    });

    return () => {
      _activeControls?.stop();
      _activeControls = null;
    };
  }, [score]);

  return (
    <div className={styles.container} aria-live="polite" aria-atomic="true">
      <span className={styles.label}>Score:</span>{' '}
      <span className={styles.value}>{displayed}</span>
    </div>
  );
}

// Module-scoped because useEffect's cleanup can't capture state set inside
// the setDisplayed callback. Per-component instance state via useRef would
// be cleaner.
let _activeControls: ReturnType<typeof animate> | null = null;
```

**Actually the above is uglier than needed — use `useRef` instead so the controls are per-component-instance, not module-shared:**

```typescript
import { useEffect, useRef, useState } from 'react';
import { animate } from 'motion/react';
import { countUp } from '../../lib/motionVariants';
import styles from './ScoreDisplay.module.css';

export type ScoreDisplayProps = {
  score: number;
};

export function ScoreDisplay({ score }: ScoreDisplayProps) {
  const [displayed, setDisplayed] = useState<number>(score);
  const displayedRef = useRef<number>(score);
  displayedRef.current = displayed;

  useEffect(() => {
    if (displayedRef.current === score) return;
    const controls = animate(displayedRef.current, score, {
      ...countUp,
      onUpdate: (v) => setDisplayed(Math.round(v)),
    });
    return () => controls.stop();
  }, [score]);

  return (
    <div className={styles.container} aria-live="polite" aria-atomic="true">
      <span className={styles.label}>Score:</span>{' '}
      <span className={styles.value}>{displayed}</span>
    </div>
  );
}
```

**Use this second version.** Cleaner, no module-scoped state, no closure gymnastics. The ref tracks the latest displayed value so the effect can read it without depending on `displayed` (which would cause the effect to re-run on every animation frame and restart the animation, ad infinitum).

### Exact `src/components/game/ScoreDisplay.module.css`

```css
.container {
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-2);
  font-family: var(--font-display);
  text-align: right;
  line-height: 1;
}

.label {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.value {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-black);
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}
```

`font-variant-numeric: tabular-nums` keeps digit widths uniform so the number doesn't jitter horizontally during count-up (each digit takes the same width).

### Exact `src/components/game/ScoreDisplay.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ScoreDisplay } from './ScoreDisplay';

describe('ScoreDisplay', () => {
  it('renders the initial score', () => {
    render(<ScoreDisplay score={0} />);
    expect(screen.getByText('Score:')).toBeTruthy();
    expect(screen.getByText('0')).toBeTruthy();
  });

  it('renders a non-zero initial score', () => {
    render(<ScoreDisplay score={42} />);
    expect(screen.getByText('42')).toBeTruthy();
  });

  it('animates count-up to the new score when the prop changes', async () => {
    const { rerender } = render(<ScoreDisplay score={0} />);
    expect(screen.getByText('0')).toBeTruthy();

    rerender(<ScoreDisplay score={5} />);
    // Animation ~250ms; waitFor's default timeout (1s) covers it.
    await waitFor(() => {
      expect(screen.getByText('5')).toBeTruthy();
    });
  });

  it('does not change the displayed value when the score prop is unchanged', () => {
    const { rerender } = render(<ScoreDisplay score={7} />);
    expect(screen.getByText('7')).toBeTruthy();
    rerender(<ScoreDisplay score={7} />);
    // Synchronous check — no animation should have run.
    expect(screen.getByText('7')).toBeTruthy();
  });

  it('marks the score region with aria-live="polite" for screen-reader updates', () => {
    const { container } = render(<ScoreDisplay score={0} />);
    const region = container.querySelector('[aria-live="polite"]');
    expect(region).toBeTruthy();
    expect(region?.getAttribute('aria-atomic')).toBe('true');
  });
});
```

### Common LLM Mistakes to Avoid

- **Do NOT** use Motion's declarative `animate` prop here — that animates CSS properties, not text content
- **Do NOT** depend on `displayed` in the useEffect's dependency array — that creates an infinite loop (effect runs → onUpdate → setDisplayed → effect runs again)
- **Do NOT** hardcode `0.25` or the bezier numbers in the component — spread `countUp` from `motionVariants.ts`
- **Do NOT** position the component absolutely or set width/height for "upper-right" — the parent component (GameScreen header in Story 1.15+) handles placement
- **Do NOT** skip the cleanup function — `controls.stop()` prevents leaked animations when score changes mid-animation or component unmounts
- **Do NOT** add `padding-zero` or zero-pad the number — design uses `tabular-nums` (uniform digit widths) to prevent jitter without padding
- **Do NOT** use `Math.floor` for the displayed value — `Math.round` avoids ending at 4 when targeting 5 (the bouncy ease can overshoot then settle)
- **Do NOT** test by faking timers — Motion's `animate()` uses requestAnimationFrame which jsdom supports natively; `waitFor` polls and works without fake timers

### About Motion in jsdom (worth confirming on first run)

Motion 12's `animate()` falls back to its own time loop driven by `requestAnimationFrame`. jsdom provides rAF (as `setTimeout(fn, 16)`). The animation runs end-to-end in jsdom; `onUpdate` fires; `setDisplayed` updates state; React re-renders; `waitFor` sees the final value.

If — for some reason — the test hangs or never sees the final value:
- Add `await new Promise((r) => setTimeout(r, 300))` before `waitFor` to give Motion's loop a moment to start
- As a last resort, fall back to a custom rAF loop in the component (same easing values from `countUp`). Keep it ugly until the next refactor.

### Testing Standards

- Vitest + jsdom (configured)
- `waitFor` for the async animation assertion
- `aria-live` query via `container.querySelector` (RTL doesn't expose a role for `aria-live` regions natively)
- `afterEach(cleanup)` already wired in `vitest.setup.ts`

### Previous Story Intelligence

**From Story 1.9 (motionVariants):**
- `countUp` Transition object exported: `{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }`
- Import path: `import { countUp } from '../../lib/motionVariants'`

**From Story 1.10 (StartScreen):**
- Established the per-component CSS Modules pattern with design tokens via `var(--...)`
- Components decoupled from reducer — ScoreDisplay similarly takes `score` as a plain prop; the parent (GameScreen, Story 1.15+) feeds it from `useGameState`

**From Story 1.8 (gameReducer):**
- `score` is part of `GameState` — a non-negative integer that only ever increases (per FR32: no negative scoring)
- Increments happen on `ANSWER_QUESTION`: +5 / +2 / +0 (computed in scoring.ts)

### Git Intelligence

Last 4 commits on main:

```
f7fcf8a Add Story 1.10 dev spec to planning artifacts
0d02d27 Story 1.10: StartScreen — wordmark + random pre-game message + START GAME
5e0fb8f Add Story 1.9 dev spec to planning artifacts
cbb6996 Story 1.9: shared primitives + ErrorBoundary + Motion install
```

Story 1.11 builds on `f7fcf8a`.

### Latest Tech Information

- **`motion/react` 12.40.0** — exports `animate(from, to, options)` as a top-level import. The returned `AnimationPlaybackControls` has a `.stop()` method.
- Verified API: `animate(0, 100, { duration: 0.5, onUpdate: (v) => console.log(v) })` is the documented signature for tweening primitive values.

No new dependencies required.

### Project Structure Notes

**Alignment with architecture:**
- `src/components/game/ScoreDisplay.tsx` + `.module.css` + `.test.tsx` ✓ (architecture lines 387–389)
- Component is presentation-only; receives state as prop. Parent will be `GameScreen` (Story 1.15+).

No deviations.

### References

- **Story source:** `_bmad-output/planning-artifacts/epics.md` § "Epic 1, Story 1.11"
- **PRD FRs:** FR7 (running score visible), FR35 (count-up animation with bounce)
- **Architecture:** §"Animation Pattern", §"Requirements → File Mapping" (F6)
- **UX:** §"Animation Patterns" — "Score count-up with --motion-base + --ease-bounce"
- **Previous stories:** 1-8 (score in state), 1-9 (countUp Transition), 1-10 (component patterns)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code)

### Debug Log References

None — implementation followed spec, Motion's `animate()` worked in jsdom on first try. The `waitFor` test for count-up reached the final value within the default 1s timeout.

### Completion Notes List

- `src/components/game/ScoreDisplay.tsx` per spec: `useState`-tracked `displayed`, `useRef` mirrors latest displayed so the effect can read it without depending on it (avoids the infinite-loop trap).
- `useEffect` triggers on `score` change, calls Motion's `animate(from, to, { ...countUp, onUpdate })`, returns `controls.stop()` for cleanup.
- `aria-live="polite"` + `aria-atomic="true"` for screen-reader friendliness during count-up.
- CSS uses `font-variant-numeric: tabular-nums` so digits don't jitter horizontally during count-up.
- **5 tests pass** (initial render, non-zero initial, animate to new score, no-change is no-op, aria-live present).
- **Test count: 130** (was 125 → +5).
- **Bundle: 194.36 kB / gzip 61.24 kB — unchanged.** ScoreDisplay isn't imported by `App.tsx` yet; Vite tree-shakes both the component and the Motion runtime code it pulls in. Real runtime cost lands when GameScreen (Story 1.15/1.16) imports it.

### File List

- **NEW** `src/components/game/ScoreDisplay.tsx`
- **NEW** `src/components/game/ScoreDisplay.module.css`
- **NEW** `src/components/game/ScoreDisplay.test.tsx`

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-23 | Story created. ScoreDisplay with count-up via Motion's imperative animate() function + countUp transition. Self-contained (parent positions it); aria-live for screen-reader updates. | bmad-create-story (Claude Opus 4.7) |
| 2026-05-23 | Story implemented and shipped. 130 tests pass (125 prior + 5 new). All ACs satisfied. Motion's animate() worked cleanly in jsdom on first try (waitFor caught final value). Bundle unchanged — ScoreDisplay tree-shaken until Story 1.15/1.16 imports it. | bmad-dev-story (Claude Opus 4.7) |
