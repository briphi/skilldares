# Story 2.5: Timer Display + useTimer Hook

Status: review

## Story

As a player,
I want a visible countdown timer on speed rounds with visual urgency at low time,
so that the speed-round pressure feels real but motivating, not panicking.

## Acceptance Criteria

1. **`src/state/useTimer.ts` exists with this contract:**
   - Options: `{ durationSeconds?: number; onExpire?: () => void; paused?: boolean }`
   - Defaults: `durationSeconds = 15`, `onExpire` = no-op, `paused = false`
   - Returns: `{ secondsRemaining: number }`
   - Counts down from `durationSeconds` to 0 in 1-second integer ticks
   - Calls `onExpire` exactly once when reaching 0
   - When `paused = true`, the countdown halts (resumes when `paused = false`)
   - Cleanup on unmount (clears the interval; no `onExpire` calls after unmount)
   - Decoupled from reducer — `onExpire` is a callback the parent wires (e.g., to `helpers.answerQuestion(false)`)

2. **`src/components/game/TimerDisplay.tsx` exists with this contract:**
   - Props: `{ secondsRemaining: number; totalSeconds?: number }` (defaults `totalSeconds = 15`)
   - Renders a horizontal progress bar — no visible text (per AC "visual progress bar, not text")
   - Bar width = `(secondsRemaining / totalSeconds) * 100%`
   - CSS transition on `width` (1s linear) gives smooth depletion between integer ticks
   - **Low-time treatment (`secondsRemaining ≤ 5`):**
     - Bar color shifts to `--color-state-warning`
     - Container gets the `shake` Motion variant (added to `motionVariants.ts` in this story)
     - `prefers-reduced-motion` disables the shake but keeps the color shift (use Motion's `useReducedMotion()` hook)
   - **Accessibility:**
     - `aria-live="polite"` region (visually hidden) announces `"{N} seconds remaining"` ONLY when low-time threshold hit (≤5s). Above 5s the region is empty (no constant chatter).
     - The bar element itself has `role="progressbar"` with `aria-valuenow`, `aria-valuemin=0`, `aria-valuemax={totalSeconds}`, `aria-label="Time remaining"`

3. **`src/lib/motionVariants.ts` extended with `shake` variant:**
   - Two named states: `still` (transform: x=0) and `shake` (oscillating x translation, ~3-4px amplitude, ~200-400ms loop, `repeat: Infinity`)
   - Comment notes that consumers should branch on `useReducedMotion()` to avoid applying `shake` when the user prefers reduced motion
   - Co-located test asserts the variant shape (matches the `fadeIn` / `countUp` pattern from Story 1.9)

4. **`useTimer.test.ts` covers (via `vi.useFakeTimers()` + `renderHook`):**
   - Starts at `durationSeconds`
   - Decrements every 1 second
   - Reaches 0 after exactly `durationSeconds` seconds
   - Calls `onExpire` exactly once when reaching 0
   - Does NOT decrement while `paused = true`
   - Cleanup on unmount cancels the interval (no `onExpire` calls after unmount)

5. **`TimerDisplay.test.tsx` covers:**
   - Renders a `role="progressbar"` element with correct `aria-valuenow`
   - Bar width is `(secondsRemaining / totalSeconds) * 100%` (inline style or data-attribute)
   - Low-time state (≤5s) sets a `data-low-time="true"` attribute (for stable CSS targeting + test selectors)
   - Above-5s state sets `data-low-time="false"`
   - aria-live region is empty above 5s, contains seconds text at ≤5s

6. **Build + tests pass:**
   - `npm test` exit 0 (223 prior + new tests)
   - `npm run build` clean
   - Bundle unchanged (TimerDisplay + useTimer tree-shaken until Stories 2.6/2.7 consume them)

## Tasks / Subtasks

- [x] **Task 1: Pre-work safety check**
  - [x] Working tree clean; on `main`; up to date
  - [x] Confirm 223 tests pass; build clean
  - [x] Create branch `story/2-5-timer-and-display`

- [x] **Task 2: Extend `src/lib/motionVariants.ts` with `shake` variant + test**
  - [x] Add `shake` per Dev Notes (still / shake states)
  - [x] Add 1-2 shape-assertion tests to `motionVariants.test.ts`

- [x] **Task 3: Implement `src/state/useTimer.ts`**
  - [x] Hook with `setInterval(1000)`, `useEffect` cleanup, `expiredRef` to guarantee single onExpire call
  - [x] Type-check clean

- [x] **Task 4: Implement `src/state/useTimer.test.ts`**
  - [x] 6+ tests per AC #4
  - [x] Use `vi.useFakeTimers()` + `vi.advanceTimersByTime(N)` (no user-event involved → no fake-timer/user-event deadlock concern)
  - [x] Tests pass

- [x] **Task 5: Implement `src/components/game/TimerDisplay.tsx`**
  - [x] Per Dev Notes — `motion.div` with `shake` variant gated by `useReducedMotion()`, progressbar role, aria-live region
  - [x] Type-check clean

- [x] **Task 6: Implement `src/components/game/TimerDisplay.module.css`**
  - [x] Bar layout, transition on width, low-time color shift via `data-low-time="true"`

- [x] **Task 7: Implement `src/components/game/TimerDisplay.test.tsx`**
  - [x] 5+ tests per AC #5
  - [x] Tests pass

- [x] **Task 8: Full test + build**
  - [x] `npm test` all green
  - [x] `npm run build` clean

- [x] **Task 9: Commit + push to main**
  - [x] Two commits (impl + spec)
  - [x] Fast-forward main, push, delete branch

## Dev Notes

### Why CSS Transition (Not JS Animation) for the Smooth Bar

The visual bar needs to "smoothly deplete over 15 seconds" — but the JS-tracked `secondsRemaining` only updates once per second (integer ticks). The bar would jump in 1-second steps if we set `width` directly.

Solution: CSS `transition: width 1s linear` on the bar. When JS updates `secondsRemaining`, the bar's new width is set, and CSS interpolates smoothly to it over 1 second. The next JS tick arrives just as the transition completes. Result: smooth depletion.

Cost: zero — CSS does the work. The bar's `aria-valuenow` updates discretely once per second, which is correct for screen readers (no per-frame chatter).

### `useTimer` Implementation Detail

```typescript
import { useEffect, useRef, useState } from 'react';

export type UseTimerOptions = {
  durationSeconds?: number;
  onExpire?: () => void;
  paused?: boolean;
};

export type UseTimerResult = {
  secondsRemaining: number;
};

export function useTimer({
  durationSeconds = 15,
  onExpire,
  paused = false,
}: UseTimerOptions = {}): UseTimerResult {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(durationSeconds);
  const expiredRef = useRef<boolean>(false);
  const onExpireRef = useRef(onExpire);

  // Keep onExpire ref fresh without restarting the interval.
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (paused) return;
    if (secondsRemaining <= 0) return;

    const id = setInterval(() => {
      setSecondsRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0 && !expiredRef.current) {
          expiredRef.current = true;
          onExpireRef.current?.();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [paused, secondsRemaining > 0]); // restart effect only on paused changes or transition out of expired state

  return { secondsRemaining };
}
```

Note: the deps array `[paused, secondsRemaining > 0]` is a slight idiom — passing a boolean derived from state. React doesn't care; what matters is the dep value changes to trigger re-run. When `secondsRemaining` transitions from positive to 0, `secondsRemaining > 0` flips from `true` to `false`, triggering cleanup (clearing the interval).

Alternative simpler form: include `secondsRemaining` directly in deps and clear/restart every second. That recreates the interval every tick (slightly wasteful but works). The dep above is the optimization.

Actually thinking more about this — the form `[paused, secondsRemaining > 0]` is unusual. Let me simplify to a cleaner imperative approach:

```typescript
useEffect(() => {
  if (paused) return;
  
  const id = setInterval(() => {
    setSecondsRemaining((prev) => {
      const next = Math.max(0, prev - 1);
      if (next === 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current?.();
        clearInterval(id); // stop ticking after expiry
      }
      return next;
    });
  }, 1000);
  
  return () => clearInterval(id);
}, [paused]);
```

This only re-runs the effect when `paused` changes. Clean. The `clearInterval(id)` inside the callback stops the interval after expiry (so we don't keep ticking on 0 forever).

### Exact `src/state/useTimer.ts`

```typescript
import { useEffect, useRef, useState } from 'react';

export type UseTimerOptions = {
  /** Countdown duration in seconds. Default 15 (per FR15). */
  durationSeconds?: number;
  /** Called exactly once when the timer reaches 0. */
  onExpire?: () => void;
  /** When true, the countdown halts. Resumes when set back to false. */
  paused?: boolean;
};

export type UseTimerResult = {
  secondsRemaining: number;
};

/**
 * Skilldares — Countdown timer hook (FR15, FR17, FR23, FR33).
 *
 * Counts down in 1-second integer ticks. Calls onExpire exactly once
 * when reaching 0; safe to leave mounted after expiry (won't fire again).
 * Decoupled from the reducer — parent wires onExpire to dispatch (typically
 * `helpers.answerQuestion(false)` per FR33).
 */
export function useTimer({
  durationSeconds = 15,
  onExpire,
  paused = false,
}: UseTimerOptions = {}): UseTimerResult {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(durationSeconds);
  const expiredRef = useRef<boolean>(false);
  const onExpireRef = useRef(onExpire);

  // Keep onExpire ref fresh without restarting the interval each render.
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (paused) return;

    const id = setInterval(() => {
      setSecondsRemaining((prev) => {
        const next = Math.max(0, prev - 1);
        if (next === 0 && !expiredRef.current) {
          expiredRef.current = true;
          onExpireRef.current?.();
          clearInterval(id);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [paused]);

  return { secondsRemaining };
}
```

### Exact `shake` Variant Addition to `motionVariants.ts`

Append to `src/lib/motionVariants.ts`:

```typescript
/**
 * Low-time shake (FR15 / TimerDisplay).
 *
 * Two states: `still` (no motion) and `shake` (small horizontal oscillation).
 * Consumers SHOULD branch on `useReducedMotion()` and pass 'still' instead of
 * 'shake' when the user prefers reduced motion (color shift stays as the
 * urgency signal in that case).
 */
export const shake: Variants = {
  still: { x: 0 },
  shake: {
    x: [0, -3, 3, -3, 3, 0],
    transition: { duration: 0.35, repeat: Infinity, ease: 'linear' },
  },
};
```

And test:

```typescript
it('shake has still and shake states; shake oscillates x', () => {
  expect(shake.still).toMatchObject({ x: 0 });
  expect((shake.shake as { x: number[] }).x).toContain(-3);
  expect((shake.shake as { x: number[] }).x).toContain(3);
});
```

### Exact `src/components/game/TimerDisplay.tsx`

```typescript
import { motion, useReducedMotion } from 'motion/react';
import { shake } from '../../lib/motionVariants';
import styles from './TimerDisplay.module.css';

export type TimerDisplayProps = {
  secondsRemaining: number;
  totalSeconds?: number;
};

const LOW_TIME_THRESHOLD = 5;

export function TimerDisplay({ secondsRemaining, totalSeconds = 15 }: TimerDisplayProps) {
  const reducedMotion = useReducedMotion();
  const isLowTime = secondsRemaining <= LOW_TIME_THRESHOLD;
  const widthPct = totalSeconds > 0 ? (secondsRemaining / totalSeconds) * 100 : 0;

  return (
    <motion.div
      className={styles.container}
      data-low-time={isLowTime}
      variants={shake}
      animate={isLowTime && !reducedMotion ? 'shake' : 'still'}
    >
      <div
        className={styles.bar}
        role="progressbar"
        aria-label="Time remaining"
        aria-valuenow={secondsRemaining}
        aria-valuemin={0}
        aria-valuemax={totalSeconds}
        style={{ width: `${widthPct}%` }}
        data-low-time={isLowTime}
      />
      {/* Screen-reader announcement: only populates at low time so we don't
          chatter "15 seconds remaining" etc. every tick of normal countdown. */}
      <div className={styles.srOnly} aria-live="polite">
        {isLowTime ? `${secondsRemaining} seconds remaining` : ''}
      </div>
    </motion.div>
  );
}
```

### Exact `src/components/game/TimerDisplay.module.css`

```css
.container {
  width: 100%;
  height: 8px;
  background-color: var(--color-bg-accent);
  border-radius: var(--radius-full);
  overflow: hidden;
  position: relative;
}

.bar {
  height: 100%;
  background-color: var(--color-brand-primary);
  transition: width 1s linear, background-color var(--motion-base) var(--ease-snappy);
  border-radius: var(--radius-full);
}

.bar[data-low-time="true"] {
  background-color: var(--color-state-warning);
}

.srOnly {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### Exact `src/state/useTimer.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimer } from './useTimer';

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts at the default duration (15s)', () => {
    const { result } = renderHook(() => useTimer());
    expect(result.current.secondsRemaining).toBe(15);
  });

  it('starts at the custom duration when provided', () => {
    const { result } = renderHook(() => useTimer({ durationSeconds: 30 }));
    expect(result.current.secondsRemaining).toBe(30);
  });

  it('decrements by 1 every second', () => {
    const { result } = renderHook(() => useTimer({ durationSeconds: 5 }));
    expect(result.current.secondsRemaining).toBe(5);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.secondsRemaining).toBe(4);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.secondsRemaining).toBe(3);
  });

  it('reaches 0 after exactly durationSeconds elapse', () => {
    const { result } = renderHook(() => useTimer({ durationSeconds: 3 }));
    act(() => { vi.advanceTimersByTime(3000); });
    expect(result.current.secondsRemaining).toBe(0);
  });

  it('calls onExpire exactly once when reaching 0', () => {
    const onExpire = vi.fn();
    renderHook(() => useTimer({ durationSeconds: 2, onExpire }));
    act(() => { vi.advanceTimersByTime(2000); });
    expect(onExpire).toHaveBeenCalledOnce();

    // Even if more time passes, onExpire shouldn't fire again.
    act(() => { vi.advanceTimersByTime(5000); });
    expect(onExpire).toHaveBeenCalledOnce();
  });

  it('does NOT decrement when paused', () => {
    const { result } = renderHook(() => useTimer({ durationSeconds: 5, paused: true }));
    act(() => { vi.advanceTimersByTime(3000); });
    expect(result.current.secondsRemaining).toBe(5);
  });

  it('cleanup on unmount stops the interval (no further onExpire)', () => {
    const onExpire = vi.fn();
    const { unmount } = renderHook(() => useTimer({ durationSeconds: 5, onExpire }));
    unmount();
    act(() => { vi.advanceTimersByTime(10000); });
    expect(onExpire).not.toHaveBeenCalled();
  });
});
```

### Exact `src/components/game/TimerDisplay.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimerDisplay } from './TimerDisplay';

describe('TimerDisplay', () => {
  it('renders a progressbar with the correct aria-valuenow', () => {
    render(<TimerDisplay secondsRemaining={12} />);
    const bar = screen.getByRole('progressbar', { name: 'Time remaining' });
    expect(bar.getAttribute('aria-valuenow')).toBe('12');
    expect(bar.getAttribute('aria-valuemax')).toBe('15');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
  });

  it('bar width matches secondsRemaining / totalSeconds (100%)', () => {
    render(<TimerDisplay secondsRemaining={15} />);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('style')).toContain('width: 100%');
  });

  it('bar width at 50%', () => {
    render(<TimerDisplay secondsRemaining={5} totalSeconds={10} />);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('style')).toContain('width: 50%');
  });

  it('marks data-low-time="false" above the 5s threshold', () => {
    const { container } = render(<TimerDisplay secondsRemaining={10} />);
    const root = container.querySelector('[data-low-time]');
    expect(root?.getAttribute('data-low-time')).toBe('false');
  });

  it('marks data-low-time="true" at or below 5s', () => {
    const { container } = render(<TimerDisplay secondsRemaining={5} />);
    const root = container.querySelector('[data-low-time]');
    expect(root?.getAttribute('data-low-time')).toBe('true');
  });

  it('aria-live region is empty above 5s', () => {
    const { container } = render(<TimerDisplay secondsRemaining={10} />);
    const live = container.querySelector('[aria-live="polite"]');
    expect(live?.textContent).toBe('');
  });

  it('aria-live region announces seconds at low time (≤5s)', () => {
    const { container } = render(<TimerDisplay secondsRemaining={3} />);
    const live = container.querySelector('[aria-live="polite"]');
    expect(live?.textContent).toBe('3 seconds remaining');
  });
});
```

### Common LLM Mistakes to Avoid

- **Do NOT** put the timer's expiry-dispatch logic inside `useTimer` — `onExpire` callback. Parent (QuestionOrder / QuestionSelect, Story 2.6/2.7) wires to `helpers.answerQuestion(false)`.
- **Do NOT** call `onExpire` more than once. Use an `expiredRef` flag.
- **Do NOT** render visible text in TimerDisplay — bar only. The aria-live region is for screen readers (`.srOnly` visually hidden).
- **Do NOT** use `requestAnimationFrame` for the countdown — `setInterval(1000)` is sufficient; CSS transitions provide smooth interpolation between ticks.
- **Do NOT** restart the interval on every render — keep `useEffect` deps minimal (`[paused]`).
- **Do NOT** stale-closure `onExpire` — use `onExpireRef` so the latest callback is called without rebuilding the interval.
- **Do NOT** assume `useReducedMotion()` returns a stable value in jsdom — it queries `matchMedia` which may not exist. Motion's hook handles the missing case (returns `false`). No mocking needed for our tests.
- **Do NOT** apply the shake variant globally (e.g., to the whole game screen) — only the timer container. Reduces accessibility burden and matches UX spec.

### Why `aria-live="polite"` (Not `assertive`)

Polite = "announce when convenient" (typically after the current speech ends). The countdown is informational urgency, not a critical interruption. Assertive would talk over other content (like the question prompt being read out). Per WAI-ARIA: polite is the right choice for status updates that don't block.

The text is empty above 5s so the assistive tech doesn't get a tick-tick-tick of "14 seconds, 13 seconds, ..." for the whole question. Only the low-time countdown ("5 seconds remaining ... 4 ...") gets announced.

### Testing Standards

- Vitest + jsdom (configured)
- `vi.useFakeTimers()` + `vi.advanceTimersByTime(N)` for the countdown
- `renderHook` + `act` for useTimer
- `render` + `screen` + `container.querySelector` for TimerDisplay (aria-live is hard to query by role; use attribute selector)

### Previous Story Intelligence

**From Story 1.9 (motionVariants):**
- `fadeIn` / `fadeOut` / `countUp` already exist; `shake` follows the same shape (named-state Variants object)
- Tests for variants assert shape, not visual behavior (jsdom doesn't animate)

**From Story 1.11 (ScoreDisplay):**
- Used Motion's imperative `animate()` for tweening a number. Different pattern from TimerDisplay (which uses declarative variants for the shake) — both legitimate, picked per use case.

**From Story 1.14 (FeedbackOverlay):**
- `motion.div` wrapper with `variants` + `animate` props is the established pattern for declarative variant-driven animations.

### Git Intelligence

Last 4 commits on main:

```
0c6077c Add Story 2.4 dev spec to planning artifacts
ffe1078 Story 2.4: ItemSquare shared primitive (Type A + Type B reuse)
814d0e8 Add Story 2.3 dev spec to planning artifacts
91efd9b Story 2.3: extend schemas + reducer + question selection (+ fix latent Epic 1 bug)
```

Story 2.5 builds on `0c6077c`.

### Latest Tech Information

- **`motion/react` 12.40.0** — exports `useReducedMotion()` hook. Returns `true` if user has `prefers-reduced-motion: reduce` set. Safe in jsdom (returns `false` if `matchMedia` is missing).
- No new dependencies.

### Project Structure Notes

**Alignment with architecture:**
- `src/state/useTimer.ts` ✓ (architecture line 435)
- `src/components/game/TimerDisplay.tsx` + `.module.css` + `.test.tsx` ✓
- `src/lib/motionVariants.ts` extended with `shake` ✓ (architecture line 305: "Shake-on-low-timer: dedicated `motion.div` with `animate={isLow ? 'shake' : 'still'}` referencing variants")

### References

- **Story source:** `_bmad-output/planning-artifacts/epics.md` § "Epic 2, Story 2.5"
- **PRD FRs:** FR15 (15s timer visible), FR17 (timer expiry = wrong), FR23 (timer applies to Type B), FR33 (speed-round expiry = 0 points), FR52 (animation polish), FR4 (NFR4 touch + accessibility)
- **Architecture:** §"Animation Pattern" line 305 (shake variant), §"State & Reducer Patterns" (hooks)
- **UX:** §"The Three-Beat Loop" Beat 2 (timer expiry handling), §"Animation Patterns" (shake at ≤5s + `prefers-reduced-motion`)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code)

### Debug Log References

None — all tests passed on first run. Fake timers + `renderHook` worked cleanly for useTimer (no user-event involved, so the v14-deadlock pattern from Stories 1.14/1.15 doesn't apply).

### Completion Notes List

- **`src/lib/motionVariants.ts`** — added `shake` variant (still / shake states with infinite x-oscillation, 0.35s linear loop). 2 new variant-shape tests.
- **`src/state/useTimer.ts`** — countdown hook with `setInterval(1000)`, `useEffect` cleanup, `expiredRef` for single-fire guarantee, `onExpireRef` to avoid stale closures without restarting the interval on every render. 7 tests cover all AC scenarios.
- **`src/components/game/TimerDisplay.tsx`** — `motion.div` wrapper with `shake` variant gated by `useReducedMotion()`. Bar with `role="progressbar"`, smooth `width` transition (CSS does interpolation between integer ticks). Polite aria-live region populates only at low time to avoid screen-reader chatter.
- **CSS strategy** — bar `width` set via inline style + CSS `transition: width 1s linear` for free smooth interpolation. Low-time color shift via `[data-low-time="true"]` attribute selector.
- **17 new tests** (7 useTimer + 8 TimerDisplay + 2 shake variant).
- **Test count: 240** (was 223 → +17).
- **Bundle: 468.50 / 138.90 kB — unchanged.** Both new modules tree-shaken until Stories 2.6/2.7 consume them.

### File List

- **NEW** `src/state/useTimer.ts`
- **NEW** `src/state/useTimer.test.ts`
- **NEW** `src/components/game/TimerDisplay.tsx`
- **NEW** `src/components/game/TimerDisplay.module.css`
- **NEW** `src/components/game/TimerDisplay.test.tsx`
- **MODIFIED** `src/lib/motionVariants.ts` (added `shake` variant)
- **MODIFIED** `src/lib/motionVariants.test.ts` (added 2 shake tests)

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-24 | Story created. useTimer hook (decoupled via onExpire callback, single-fire on expiry, paused-aware) + TimerDisplay component (CSS-transition smooth bar, low-time color shift + shake variant gated by useReducedMotion, polite aria-live announcement only at low time). shake variant added to motionVariants.ts. | bmad-create-story (Claude Opus 4.7) |
| 2026-05-24 | Story implemented and shipped. 17 new tests (7 useTimer + 8 TimerDisplay + 2 shake variant). Bundle unchanged — tree-shaken until Stories 2.6/2.7 consume. | bmad-dev-story (Claude Opus 4.7) |
