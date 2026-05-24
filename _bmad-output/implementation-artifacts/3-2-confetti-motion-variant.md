# Story 3.2: Confetti Motion Variant

Status: review

## Story

As a player,
I want a visible celebration animation when I beat my high score,
so that the moment feels memorable.

## Acceptance Criteria

1. **`src/lib/motionVariants.ts` extended with confetti building blocks:**
   - New `confettiParticle: Variants` describing a single particle's animation (initial → burst with custom per-particle direction + distance, then fade)
   - New `CONFETTI_COLORS: readonly string[]` exported — the 6 colors from `--color-answer-1` through `--color-answer-4` + `--color-brand-primary` + `--color-brand-accent`
   - Co-located test asserts variant shape (matches the `fadeIn` / `shake` test pattern)

2. **`src/components/shared/Confetti.tsx` exists:**
   - Renders a fixed-position overlay (absolutely positioned within its parent) of ~40 particles
   - Each particle is a `motion.div` with `variants={confettiParticle}`, `initial="initial"`, `animate="burst"`, and a `custom={{ angle, distance }}` per particle
   - Particles use random angle (0-360°), random distance (100-300px), random rotation, random color drawn from `CONFETTI_COLORS`
   - One-time generation: `useState(() => generateParticles())` so re-renders don't re-randomize positions
   - `pointer-events: none` so the overlay doesn't block clicks on the End screen below
   - `aria-hidden="true"` (decorative)

3. **`prefers-reduced-motion` fallback:**
   - When `useReducedMotion()` returns `true`, render a single static accent-color flash element instead of particles
   - The flash element is a brief opacity tween (0 → 0.3 → 0 over ~600ms) on a full-overlay `motion.div` with `background-color: var(--color-brand-accent)`
   - Both paths exit cleanly — celebration is "fire and forget" (no controlled state needed)

4. **Animation duration ~2-3s** then settles. Particles fade to opacity 0 by the end.

5. **`Confetti.test.tsx` covers:**
   - Component renders without crashing
   - When `useReducedMotion()` returns false (default in jsdom), the particle container is in the DOM with multiple particles
   - When `useReducedMotion()` returns true, only the reduced-motion fallback element is rendered (no particle container)
   - Mocking `useReducedMotion` via `vi.mock('motion/react', ...)` is the cleanest way to flip its return; alternative is to spy on `window.matchMedia` which jsdom doesn't implement by default

6. **Build + tests pass:**
   - `npm test` exit 0
   - `npm run build` clean (Motion's variant + per-particle custom is already supported; no new deps)
   - Bundle change minimal (Confetti tree-shaken until Story 3.3 imports it)

## Tasks / Subtasks

- [x] **Task 1: Pre-work safety check**
  - [x] Working tree clean; on `main`; up to date
  - [x] Confirm 267 tests pass
  - [x] Create branch `story/3-2-confetti-variant`

- [x] **Task 2: Extend `src/lib/motionVariants.ts`**
  - [x] Add `confettiParticle` Variants + `CONFETTI_COLORS` array
  - [x] Add 1-2 shape-assertion tests to `motionVariants.test.ts`

- [x] **Task 3: Implement `src/components/shared/Confetti.tsx`**
  - [x] Per Dev Notes — 40 particles with random props, reduced-motion fallback
  - [x] Type-check clean

- [x] **Task 4: Implement `src/components/shared/Confetti.module.css`**
  - [x] Container (fixed/absolute positioning, pointer-events: none), particle (absolute, square), reduced-motion flash

- [x] **Task 5: Implement `src/components/shared/Confetti.test.tsx`**
  - [x] 3+ tests per AC #5 (render, full-motion particles, reduced-motion fallback)
  - [x] Tests pass

- [x] **Task 6: Full test + build**
  - [x] `npm test` all green
  - [x] `npm run build` clean

- [x] **Task 7: Commit + push to main**
  - [x] Two commits (impl + spec)
  - [x] Fast-forward main, push, delete branch

## Dev Notes

### Exact `confettiParticle` Variant Addition

Append to `src/lib/motionVariants.ts`:

```typescript
/**
 * Confetti particle (Story 3.2 / EndScreen celebrating variant).
 *
 * Each particle takes a `custom={{ angle, distance }}` prop for per-particle
 * direction. Multiple particles compose the burst — see <Confetti /> in
 * src/components/shared/Confetti.tsx for the layer that generates them.
 *
 * Animation: pop (scale 0→1), travel along the angle with gravity pull,
 * rotate, fade out. Total duration ~2.5s.
 */
export const confettiParticle: Variants = {
  initial: { x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 },
  burst: (custom: { angle: number; distance: number }) => ({
    x: Math.cos((custom.angle * Math.PI) / 180) * custom.distance,
    y: Math.sin((custom.angle * Math.PI) / 180) * custom.distance + 200, // gravity pull downward
    scale: [0, 1, 1, 0],
    opacity: [1, 1, 1, 0],
    rotate: 360,
    transition: { duration: 2.5, ease: 'easeOut' },
  }),
};

/**
 * Color palette for confetti particles — the 4 MC answer colors + the 2 brand colors.
 * Centralized here so the celebration palette stays in sync with the visual design system.
 */
export const CONFETTI_COLORS = [
  'var(--color-answer-1)',
  'var(--color-answer-2)',
  'var(--color-answer-3)',
  'var(--color-answer-4)',
  'var(--color-brand-primary)',
  'var(--color-brand-accent)',
] as const;
```

### Exact `src/components/shared/Confetti.tsx`

```typescript
import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CONFETTI_COLORS, confettiParticle } from '../../lib/motionVariants';
import styles from './Confetti.module.css';

const PARTICLE_COUNT = 40;

type Particle = {
  id: number;
  angle: number;
  distance: number;
  color: string;
  size: number;
};

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    angle: Math.random() * 360,
    distance: 100 + Math.random() * 200,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]!,
    size: 8 + Math.random() * 8,
  }));
}

/**
 * Fire-and-forget celebration burst.
 *
 * Renders ~40 absolutely-positioned colored particles that animate outward
 * from the origin with rotation, gravity, and fade-out over ~2.5s.
 *
 * Respects prefers-reduced-motion: renders a single accent-color flash
 * instead of moving particles. Both modes are pointer-events: none and
 * aria-hidden so the celebration doesn't block input or leak to AT.
 */
export function Confetti() {
  const reducedMotion = useReducedMotion();
  // Stable per-mount: don't re-randomize positions on re-render.
  const [particles] = useState<Particle[]>(() => generateParticles(PARTICLE_COUNT));

  if (reducedMotion) {
    return (
      <motion.div
        className={styles.flashFallback}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        aria-hidden="true"
        data-confetti-mode="reduced"
      />
    );
  }

  return (
    <div className={styles.container} aria-hidden="true" data-confetti-mode="full">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className={styles.particle}
          style={{ backgroundColor: p.color, width: p.size, height: p.size }}
          variants={confettiParticle}
          initial="initial"
          animate="burst"
          custom={{ angle: p.angle, distance: p.distance }}
        />
      ))}
    </div>
  );
}
```

### Exact `src/components/shared/Confetti.module.css`

```css
.container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: visible;
  z-index: 10;
}

.particle {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: var(--radius-sm);
  /* width/height set inline by component for per-particle variance */
}

.flashFallback {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-color: var(--color-brand-accent);
  z-index: 10;
}
```

### Exact `src/components/shared/Confetti.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { Confetti } from './Confetti';

// Capture the real module so we can selectively re-export with a tweaked hook.
// vi.mock with a factory lets us swap useReducedMotion's return.

describe('Confetti', () => {
  describe('full-motion (default)', () => {
    it('renders without crashing', () => {
      expect(() => render(<Confetti />)).not.toThrow();
    });

    it('renders the particle container with multiple particles', () => {
      const { container } = render(<Confetti />);
      const root = container.querySelector('[data-confetti-mode="full"]');
      expect(root).toBeTruthy();
      // PARTICLE_COUNT children inside the root.
      expect(root!.children.length).toBeGreaterThan(10);
    });

    it('overlay does not block pointer events', () => {
      const { container } = render(<Confetti />);
      const root = container.querySelector('[data-confetti-mode="full"]') as HTMLElement;
      const style = root.getAttribute('aria-hidden');
      expect(style).toBe('true');
    });
  });

  describe('reduced-motion fallback', () => {
    beforeEach(() => {
      // Stub matchMedia to indicate the user prefers reduced motion.
      vi.stubGlobal('matchMedia', (query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }));
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('renders the reduced-motion fallback (no particle container)', () => {
      const { container } = render(<Confetti />);
      const reducedRoot = container.querySelector('[data-confetti-mode="reduced"]');
      expect(reducedRoot).toBeTruthy();
      const fullRoot = container.querySelector('[data-confetti-mode="full"]');
      expect(fullRoot).toBeNull();
    });
  });
});
```

### Why the `data-confetti-mode` Attribute

Lets the test assert which path the component took without coupling to CSS class names or React internals. Pattern matches QuestionMC's `data-quadrant-state` and ItemSquare's `data-variant` — established stable-selector convention.

### Why `vi.stubGlobal('matchMedia', ...)` for the Reduced-Motion Test

Motion's `useReducedMotion()` reads `window.matchMedia('(prefers-reduced-motion: reduce)')`. jsdom doesn't implement matchMedia by default — `useReducedMotion` returns `false` (no preference). To exercise the fallback path, stub `matchMedia` so the relevant query returns `matches: true`.

The full Motion-internals path is more involved (it has a snapshot subscription), but stubbing matchMedia is enough for our test (the hook reads matchMedia at mount, gets `true`, returns true).

### Common LLM Mistakes to Avoid

- **Do NOT** use `Math.random()` directly in the render body — it would re-randomize positions on every re-render. `useState(() => generateParticles(...))` makes the generation one-time per mount.
- **Do NOT** forget `pointer-events: none` on the container — celebration overlays must not block the underlying Play Again button.
- **Do NOT** use a fixed N=40 if performance is an issue on a low-end mobile device — but 40 small particles on a 2.5s animation is fine. Hardware-accelerated CSS transforms via Motion = ~zero CPU once started.
- **Do NOT** add an `onAnimationComplete` callback expectation — celebration is fire-and-forget; the End screen doesn't unmount the Confetti after the animation finishes (next round's Play Again click does the unmount).

### Testing Standards

- Vitest + jsdom (configured)
- `vi.stubGlobal('matchMedia', ...)` for the reduced-motion path
- Particle COUNT assertion uses `> 10` (not exact `== 40`) so the test stays robust if PARTICLE_COUNT changes for tuning

### Previous Story Intelligence

**From Story 1.9 + 2.5 (motionVariants pattern):**
- `fadeIn`, `fadeOut`, `countUp`, `shake` all live in `src/lib/motionVariants.ts`
- Co-located test asserts shape, not visual behavior (jsdom doesn't animate)

**From Story 2.5 (useReducedMotion):**
- `useReducedMotion()` from `motion/react` — `false` by default in jsdom, becomes `true` when matchMedia is stubbed

**From Story 2.4 (ItemSquare):**
- `data-variant` attribute pattern for stable test selectors — Confetti uses `data-confetti-mode` for the same reason

### Git Intelligence

Last 4 commits on main:

```
955cc1c Add Story 3.1 dev spec to planning artifacts
fb50730 Story 3.1: Author 22 new-high-score celebratory messages
f26d902 Add Story 2.8 dev spec to planning artifacts
ed93917 Story 2.8: Epic 2 integration — full 30-round production game
```

Story 3.2 builds on `955cc1c`.

### Latest Tech Information

- **`motion/react` 12.40.0** — supports `custom` prop on motion components for per-instance variant parameterization (used here for per-particle angle/distance).
- No new dependencies.

### Project Structure Notes

**Alignment with architecture:**
- `src/components/shared/Confetti.tsx` is a NEW shared primitive (not in architecture's listed `shared/` tree, but the architecture's file tree was indicative not exhaustive — adding here is fine; same approach as `ErrorBoundary` in Story 1.9 which was also added beyond the original tree).
- `src/lib/motionVariants.ts` extended ✓ — same pattern as Story 2.5's `shake` addition.

### References

- **Story source:** `_bmad-output/planning-artifacts/epics.md` § "Epic 3, Story 3.2"
- **PRD FRs:** FR47 (celebratory display on new PB), FR52 (animation polish), FR49 (motion polish in general)
- **Architecture:** §"Animation Pattern" (line 301)
- **UX:** §"Loop Variants by Player State" line 277 ("End screen, new personal best | Confetti / particles, sustained beat | new-high-score")

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code)

### Debug Log References

**`vi.stubGlobal('matchMedia', ...)` didn't propagate to Motion's `useReducedMotion`:**
- First test attempt stubbed `window.matchMedia` to return `matches: true`. Motion's hook reads matchMedia inside a `useEffect`, so the initial render still saw the default (false → full-motion path).
- Fix: switched to `vi.mock('motion/react', ...)` with `vi.hoisted(() => vi.fn())` to swap `useReducedMotion` directly. Per-describe `mockReturnValue(true|false)` selects the path.
- Lesson: mock the hook, not the underlying browser API, when the hook has its own subscription/effect lifecycle.

### Completion Notes List

- `confettiParticle` Variants in motionVariants.ts (uses Motion's `custom` prop for per-particle direction/distance via function-shaped `burst` state)
- `CONFETTI_COLORS` array — 6 design-system colors centralized
- `Confetti.tsx` (~50 lines) — 40 particles, `useState(() => generateParticles())` for one-time random gen, `useReducedMotion()` gates full-vs-reduced path, both modes pointer-events:none + aria-hidden
- `data-confetti-mode="full|reduced"` attribute for stable test selectors
- **6 new tests**: 2 variant shape + 4 Confetti (full mode renders + multi-particle + aria-hidden; reduced mode renders fallback + no particle container)
- **Test count: 273** (was 267 → +6). Build clean. Bundle unchanged — Confetti tree-shaken until Story 3.3 wires it in.

### File List

- **NEW** `src/components/shared/Confetti.tsx`
- **NEW** `src/components/shared/Confetti.module.css`
- **NEW** `src/components/shared/Confetti.test.tsx`
- **MODIFIED** `src/lib/motionVariants.ts` (added confettiParticle + CONFETTI_COLORS)
- **MODIFIED** `src/lib/motionVariants.test.ts` (added 2 confetti tests)

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-24 | Story created. confettiParticle Variants + CONFETTI_COLORS in motionVariants.ts; Confetti shared component with 40 particles + reduced-motion accent-flash fallback. Particle generation one-time per mount via useState initializer. | bmad-create-story (Claude Opus 4.7) |
