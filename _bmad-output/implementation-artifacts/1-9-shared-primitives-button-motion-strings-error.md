# Story 1.9: Shared Primitives — Button, motionVariants, uiStrings, ErrorScreen, ErrorBoundary

Status: review

## Story

As a developer,
I want the shared primitives + error infrastructure in place (Button, motionVariants, uiStrings, ErrorScreen, top-level ErrorBoundary, Motion library installed),
so that every subsequent screen and gameplay story can depend on them — no reinventing of CTAs, animation variants, copy, or error handling.

## ⚠️ Architecturally significant: First UI components ship in this story

Stories 1.1–1.8 built pure logic, content, schemas, and state without rendering anything. Story 1.9 introduces the first React components the user will ever see. After this story, `<App>` is wrapped in an `<ErrorBoundary>` but still renders the Vite landing page inside — Story 1.10 mounts `<GameProvider>` and the screen switcher.

This story also **installs Motion** (`motion/react`, the renamed Framer Motion) — the project's animation library per architecture §"Frontend Architecture".

## Acceptance Criteria

1. **Motion library installed:**
   - `motion` added to `dependencies` (latest stable, ≥12)
   - npm install completes cleanly; verify with `npm ls motion`

2. **`src/lib/motionVariants.ts` — single source of motion language (FR49–FR52):**
   - Exports `fadeIn` and `fadeOut` variants (used by `<AnimatePresence>` for screen transitions, `--motion-base` + `--ease-snappy`)
   - Exports `countUp` transition object (used by ScoreDisplay in Story 1.11, `--motion-base` + `--ease-bounce`)
   - All values reference design tokens via the values defined in `src/styles/global.css` (250ms base, snappy + bounce eases)
   - Pure module: zero React imports, zero DOM access — just JS objects typed against Motion's `Variants` / `Transition` types
   - Co-located test: `motionVariants.test.ts` asserts the exported shape (duration, easing reference) so accidental changes are caught

3. **`src/content/uiStrings.ts` — every UI string in one place (voice consistency per FR41):**
   - Single object literal exported as `uiStrings`
   - Includes: app title, all 6 button labels (start, lock-in, hint, next, finish, play-again), error-screen heading + body, end-screen labels (final-score label, personal-best label, no-PB placeholder), question-progress formatter (`(round, total) => "Q 3/30"`)
   - Voice consistent with the message pools (irreverent, terse — see Dev Notes for exact strings)
   - No React imports — plain TS

4. **`src/components/shared/Button.tsx` — primary + secondary variants:**
   - Props: `variant: 'primary' | 'secondary'`, `disabled?: boolean`, `onClick`, `type?: 'button' | 'submit'`, `children`, `aria-label?`
   - Renders a semantic `<button>` (NOT a `<div>`) — keyboard accessible by default
   - `variant="primary"`: gold background (`--color-brand-primary`), text-inverse color, `min-height: 56px`, full-width-ish layout
   - `variant="secondary"`: pill, muted, `min-height: 44px`, narrower
   - Uses CSS Modules (`Button.module.css`) for styling — design tokens via `var(--...)`, never hardcoded
   - Disabled state visually distinct (lowered opacity + `cursor: not-allowed`) and `disabled` attribute set on the underlying button
   - Co-located test (`Button.test.tsx`) covers: renders children, click handler fires, disabled state suppresses click, both variants render with their class

5. **`src/components/shared/ErrorScreen.tsx` — voice-laden fallback (FR58):**
   - Renders the error heading + body from `uiStrings.errorScreen`
   - Outer element has `role="alert"` (so screen readers announce it)
   - Uses CSS Modules (`ErrorScreen.module.css`) with centered layout, large heading, design tokens
   - No retry button per UX spec — refreshing is the only "fix"
   - Co-located test covers: renders heading + body text from uiStrings, has `role="alert"`

6. **`src/components/shared/ErrorBoundary.tsx` — top-level boundary:**
   - React class component (function components can't catch errors)
   - `componentDidCatch` + `getDerivedStateFromError` — when any descendant render throws (including Zod ZodError from content validation), state flips to `hasError: true` and the next render returns `<ErrorScreen />`
   - In dev (and tests), the caught error is logged to `console.error` for debugging visibility
   - Co-located test triggers an error from a child and asserts `ErrorScreen` renders

7. **`src/App.tsx` wraps its existing content in `<ErrorBoundary>`:**
   - `App.tsx` now imports + wraps with `ErrorBoundary`
   - What `App` renders INSIDE the boundary is unchanged from Story 1.1 (Vite landing page is fine — Story 1.10 replaces this with the screen switcher)
   - The site continues to load and look identical to today's production deploy

8. **Build + tests pass:**
   - `npm test` exit 0 (107 prior + new tests)
   - `npm run build` clean
   - Bundle size grows (Motion bundle), but no errors
   - Live site at `https://www.skilldares.com/` still renders the Vite landing page (visually unchanged) — but now under an ErrorBoundary

## Tasks / Subtasks

- [x] **Task 1: Pre-work safety check**
  - [x] Working tree clean
  - [x] On `main`, up to date with `origin/main`
  - [x] Verify Story 1.8 in place: `src/lib/gameReducer.ts`, `src/state/GameProvider.tsx`; `npm test` shows 107 passing
  - [x] Create feature branch `story/1-9-shared-primitives`

- [x] **Task 2: Install Motion**
  - [x] `npm install motion` (NOT `framer-motion` — that's the old package name; current package is `motion`)
  - [x] Verify: `npm ls motion` shows a single resolved version
  - [x] Run `npm test` — all 107 existing tests still pass (sanity check; Motion adds no runtime surface to existing modules)

- [x] **Task 3: Implement `src/lib/motionVariants.ts` + test**
  - [x] Create file with exact content in Dev Notes (fadeIn, fadeOut, countUp)
  - [x] Co-located `motionVariants.test.ts` with shape assertions
  - [x] `npx tsc --noEmit` clean
  - [x] Tests pass

- [x] **Task 4: Implement `src/content/uiStrings.ts`**
  - [x] Create `src/content/` directory
  - [x] File contents per Dev Notes — single `uiStrings` object literal export
  - [x] `npx tsc --noEmit` clean

- [x] **Task 5: Implement `src/components/shared/Button.tsx` + CSS Module + test**
  - [x] Create `src/components/shared/` directory
  - [x] `Button.tsx` with the props/behavior per AC #4 and exact content in Dev Notes
  - [x] `Button.module.css` with both variants, design tokens via `var(--...)`
  - [x] `Button.test.tsx` per Dev Notes (5+ tests)
  - [x] Tests pass

- [x] **Task 6: Implement `src/components/shared/ErrorScreen.tsx` + CSS Module + test**
  - [x] `ErrorScreen.tsx` per Dev Notes (consumes `uiStrings.errorScreen`, `role="alert"`)
  - [x] `ErrorScreen.module.css` per Dev Notes
  - [x] `ErrorScreen.test.tsx` (renders heading/body, has role="alert")
  - [x] Tests pass

- [x] **Task 7: Implement `src/components/shared/ErrorBoundary.tsx` + test**
  - [x] Class component per Dev Notes
  - [x] Test: child that throws → ErrorScreen rendered
  - [x] Test: child that does not throw → child rendered
  - [x] Suppress React's expected `console.error` noise in the throwing test
  - [x] Tests pass

- [x] **Task 8: Wrap `src/App.tsx` in `<ErrorBoundary>`**
  - [x] Import ErrorBoundary
  - [x] Wrap whatever `App` currently renders inside `<ErrorBoundary>`
  - [x] Do NOT change what's rendered inside (leave Vite landing page intact — Story 1.10's job)

- [x] **Task 9: Full test suite + build verification**
  - [x] `npm test` all green
  - [x] `npm run build` clean
  - [x] Bundle size noted in completion notes (Motion adds ~20-30 kB gzipped)

- [x] **Task 10: Commit + push + verify deploy**
  - [x] Stage all new + modified files
  - [x] Commit with descriptive message
  - [x] Stage spec separately, second commit
  - [x] Fast-forward `main`, push, delete branch
  - [x] Verify Amplify build clean; live site still loads (visually unchanged inside the boundary)

## Dev Notes

### Why Motion installs in this story

`motionVariants.ts` is the consumer of Motion's `Variants` and `Transition` types. We could define the objects without a type import (they're plain JS), but the type safety prevents silent drift when later stories add screen transitions. Installing in 1.9 lets every subsequent component story (1.10+) immediately use the shared variants.

Motion package name: **`motion`** (not `framer-motion` — the package was renamed in 2024). React-side import is `motion/react`. Latest stable is 12.x as of 2026-05.

### Exact `src/lib/motionVariants.ts`

```typescript
import type { Variants, Transition } from 'motion/react';

/**
 * Skilldares — Motion variants (FR49–FR52).
 *
 * Single source of truth for animation language. Components MUST consume
 * variants from here — never inline duration / easing values across
 * the codebase. The actual timing values reference --motion-base (250ms)
 * and the eases declared in src/styles/global.css; we duplicate the
 * resolved numbers here because Motion needs JS values, not CSS vars.
 */

// 250ms base, matches --motion-base
const BASE_DURATION = 0.25;

// matches --ease-snappy = cubic-bezier(0.4, 0, 0.2, 1)
const EASE_SNAPPY: [number, number, number, number] = [0.4, 0, 0.2, 1];

// matches --ease-bounce = cubic-bezier(0.34, 1.56, 0.64, 1)
const EASE_BOUNCE: [number, number, number, number] = [0.34, 1.56, 0.64, 1];

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: BASE_DURATION, ease: EASE_SNAPPY } },
};

export const fadeOut: Variants = {
  exit: { opacity: 0, transition: { duration: BASE_DURATION, ease: EASE_SNAPPY } },
};

/**
 * Transition used by the ScoreDisplay count-up tween (Story 1.11).
 * Consumers spread `...countUp` onto a `motion.span`'s `transition` prop.
 */
export const countUp: Transition = {
  duration: BASE_DURATION,
  ease: EASE_BOUNCE,
};
```

### Exact `src/lib/motionVariants.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { fadeIn, fadeOut, countUp } from './motionVariants';

describe('motionVariants', () => {
  it('fadeIn has initial + animate keys with 0 → 1 opacity', () => {
    expect(fadeIn.initial).toMatchObject({ opacity: 0 });
    expect(fadeIn.animate).toMatchObject({ opacity: 1 });
  });

  it('fadeOut has exit key dropping opacity to 0', () => {
    expect(fadeOut.exit).toMatchObject({ opacity: 0 });
  });

  it('countUp uses the bounce ease and base duration', () => {
    expect(countUp.duration).toBe(0.25);
    expect(countUp.ease).toEqual([0.34, 1.56, 0.64, 1]);
  });
});
```

### Exact `src/content/uiStrings.ts`

```typescript
/**
 * Skilldares — UI Strings.
 *
 * Every UI string used by the app lives here. Components MUST NOT contain
 * hardcoded English text. Voice consistency with the 8 message pools
 * (FR41) is enforced by keeping all copy in one editable file.
 *
 * Voice: irreverent, terse, knows the player wants to be in on the joke.
 */

export const uiStrings = {
  appTitle: 'SKILLDARES',

  buttons: {
    start: 'START GAME',
    lockIn: 'LOCK IT IN',
    hint: '💡 Hint',
    next: 'NEXT →',
    finish: 'FINISH IT',
    playAgain: 'RUN IT BACK',
  },

  errorScreen: {
    heading: 'Welp. That broke.',
    body: 'Try refreshing. If it keeps happening, the universe is messing with you.',
  },

  endScreen: {
    finalScoreLabel: 'FINAL DAMAGE',
    personalBestLabel: 'ALL-TIME BEST',
    noPbValue: '—',
  },

  /** "Q 5/30" — keep terse; component renders it in the gameplay header. */
  progress: (round: number, total: number): string => `Q ${round}/${total}`,
} as const;

export type UiStrings = typeof uiStrings;
```

### Exact `src/components/shared/Button.tsx`

```typescript
import { type ReactNode, type MouseEventHandler } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary';

export type ButtonProps = {
  variant: ButtonVariant;
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  type?: 'button' | 'submit';
  'aria-label'?: string;
};

export function Button({
  variant,
  children,
  onClick,
  disabled = false,
  type = 'button',
  'aria-label': ariaLabel,
}: ButtonProps) {
  const className =
    variant === 'primary'
      ? `${styles.base} ${styles.primary}`
      : `${styles.base} ${styles.secondary}`;

  return (
    <button
      type={type}
      className={className}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      data-variant={variant}
    >
      {children}
    </button>
  );
}
```

### Exact `src/components/shared/Button.module.css`

```css
.base {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-ui);
  font-weight: var(--font-weight-bold);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: transform var(--motion-fast) var(--ease-snappy),
    opacity var(--motion-fast) var(--ease-snappy);
  letter-spacing: 0.02em;
  text-align: center;
}

.base:active:not(:disabled) {
  transform: scale(0.98);
}

.base:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.primary {
  min-height: 56px;
  padding: var(--space-3) var(--space-6);
  font-size: var(--text-lg);
  background-color: var(--color-brand-primary);
  color: var(--color-text-inverse);
  width: 100%;
  max-width: 480px;
}

.secondary {
  min-height: 44px;
  padding: var(--space-2) var(--space-5);
  font-size: var(--text-md);
  background-color: var(--color-bg-accent);
  color: var(--color-text-primary);
  border-radius: var(--radius-full);
}
```

### Exact `src/components/shared/Button.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button variant="primary">Hello</Button>);
    expect(screen.getByRole('button', { name: 'Hello' })).toBeTruthy();
  });

  it('invokes onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button variant="primary" onClick={onClick}>Tap</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not invoke onClick when disabled', async () => {
    const onClick = vi.fn();
    render(<Button variant="primary" onClick={onClick} disabled>Tap</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders with the primary variant marker', () => {
    render(<Button variant="primary">P</Button>);
    expect(screen.getByRole('button').getAttribute('data-variant')).toBe('primary');
  });

  it('renders with the secondary variant marker', () => {
    render(<Button variant="secondary">S</Button>);
    expect(screen.getByRole('button').getAttribute('data-variant')).toBe('secondary');
  });

  it('forwards aria-label', () => {
    render(<Button variant="primary" aria-label="Begin the game">Go</Button>);
    expect(screen.getByRole('button', { name: 'Begin the game' })).toBeTruthy();
  });
});
```

### Exact `src/components/shared/ErrorScreen.tsx`

```typescript
import { uiStrings } from '../../content/uiStrings';
import styles from './ErrorScreen.module.css';

export function ErrorScreen() {
  return (
    <div role="alert" className={styles.container}>
      <div className={styles.mark} aria-hidden="true">✗</div>
      <h1 className={styles.heading}>{uiStrings.errorScreen.heading}</h1>
      <p className={styles.body}>{uiStrings.errorScreen.body}</p>
    </div>
  );
}
```

### Exact `src/components/shared/ErrorScreen.module.css`

```css
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space-6);
  text-align: center;
  gap: var(--space-4);
}

.mark {
  font-size: var(--text-3xl);
  color: var(--color-state-error);
  font-weight: var(--font-weight-black);
  line-height: 1;
}

.heading {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-black);
  color: var(--color-text-primary);
  margin: 0;
}

.body {
  font-family: var(--font-body);
  font-size: var(--text-md);
  color: var(--color-text-muted);
  max-width: 480px;
  margin: 0;
}
```

### Exact `src/components/shared/ErrorScreen.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorScreen } from './ErrorScreen';
import { uiStrings } from '../../content/uiStrings';

describe('ErrorScreen', () => {
  it('renders the heading and body from uiStrings', () => {
    render(<ErrorScreen />);
    expect(screen.getByText(uiStrings.errorScreen.heading)).toBeTruthy();
    expect(screen.getByText(uiStrings.errorScreen.body)).toBeTruthy();
  });

  it('has role=alert so screen readers announce it', () => {
    render(<ErrorScreen />);
    expect(screen.getByRole('alert')).toBeTruthy();
  });
});
```

### Exact `src/components/shared/ErrorBoundary.tsx`

```typescript
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorScreen } from './ErrorScreen';

type ErrorBoundaryProps = { children: ReactNode };
type ErrorBoundaryState = { hasError: boolean };

/**
 * Skilldares — top-level error boundary (FR58).
 *
 * Catches any uncaught render error in descendants — including Zod
 * validation throws when content fails to parse at module load.
 * Renders <ErrorScreen /> in place of the failed tree.
 *
 * Class component is required: React does not expose error catching
 * to function components / hooks as of React 19.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Surface to dev tools / Amplify logs. Production swallows silently
    // beyond what console.error captures (no Sentry in v1).
    console.error('[Skilldares] ErrorBoundary caught:', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <ErrorScreen />;
    }
    return this.props.children;
  }
}
```

### Exact `src/components/shared/ErrorBoundary.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';
import { uiStrings } from '../../content/uiStrings';

function Boom(): never {
  throw new Error('kaboom');
}

describe('ErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // React logs its own error noise when a render throws under a boundary.
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>Safe content</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Safe content')).toBeTruthy();
  });

  it('renders <ErrorScreen /> when a child throws', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText(uiStrings.errorScreen.heading)).toBeTruthy();
  });
});
```

### `src/App.tsx` Change

The current `App.tsx` (Vite landing page) gets wrapped. Read it first, then surgically wrap its top-level return in `<ErrorBoundary>`. **Do NOT** replace what's inside — that's Story 1.10. After this story, the live site should look identical to today.

Example shape:

```tsx
import { ErrorBoundary } from './components/shared/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      {/* existing Vite scaffold content, unchanged */}
    </ErrorBoundary>
  );
}
```

### Common LLM Mistakes to Avoid

- **Do NOT** install `framer-motion` — the package was renamed; use **`motion`** (import `motion/react`)
- **Do NOT** hardcode any color, spacing, font, or motion value — every CSS value must reference a `var(--token)` from `src/styles/global.css`
- **Do NOT** put React imports in `motionVariants.ts` — pure JS module with `import type` only for the Motion types
- **Do NOT** put English text in any component — pull from `uiStrings`
- **Do NOT** make `ErrorBoundary` a function component — function components cannot catch errors in React 19; class is required
- **Do NOT** add a "Retry" button to `ErrorScreen` — per UX spec the only recovery is refresh
- **Do NOT** mount `<GameProvider>` in `App.tsx` — that's Story 1.10's wiring
- **Do NOT** add `prefers-reduced-motion` handling to Button or ErrorScreen — Button has subtle scale, ErrorScreen has no animation; honour-on-motion is handled per-component where motion is meaningful (TimerDisplay shake, etc.)
- **Do NOT** use `@testing-library/jest-dom` matchers (`toBeInTheDocument`, etc.) — they're not configured. Use plain `toBeTruthy()` on the returned element or `.getAttribute(...)` for attribute checks
- **Do NOT** wrap the test components in `<GameProvider>` — these primitives don't consume game state

### Testing Standards

- Vitest + jsdom (already configured)
- `render` + `screen` + `userEvent` from `@testing-library/react` and `@testing-library/user-event`
- Suppress expected React console noise via `vi.spyOn(console, 'error').mockImplementation(...)` only in tests that intentionally trigger errors
- Co-locate tests with source files
- No `data-testid` unless absolutely necessary — query by role + accessible name

### Previous Story Intelligence

**From Story 1.7 (test infra):**
- jsdom configured via `vite.config.ts`
- `vitest.setup.ts` handles Node 26 localStorage workaround
- `@testing-library/react@16.3.2` + `@testing-library/user-event@14.6.1` installed

**From Story 1.8 (state core):**
- `renderHook` `act()` gotcha: don't loop on `result.current` inside a single `act()` block
- `useMemo` for stable identity on returned objects from hooks
- Co-located test pattern: `Foo.tsx` + `Foo.test.tsx` next to each other

**From Story 1.2 (design tokens):**
- All design tokens live in `src/styles/global.css` under `:root`
- Token names: `--color-*`, `--font-*`, `--text-*`, `--space-*`, `--radius-*`, `--motion-*`, `--ease-*`
- CSS Modules consume via `var(--token-name)`; never hardcode

### Git Intelligence

Last 4 commits on main:

```
fac28b7 Add Story 1.8 dev spec to planning artifacts
83954cc Story 1.8: gameReducer + GameProvider + useGameState
e56e090 Add Story 1.7 dev spec to planning artifacts
7ae55ea Story 1.7: localStorage wrapper + useHighScore hook + jsdom test env
```

Story 1.9 builds on `fac28b7`.

### Latest Tech Information

- **`motion` 12.x** — current React-side import path: `motion/react`; previously known as Framer Motion. Renamed package in 2024.
- **React 19** — `Component`/class lifecycle hooks (`componentDidCatch`, `getDerivedStateFromError`) still fully supported; error boundaries remain class-only.
- **CSS Modules** — Vite has zero-config support; import as `import styles from './Foo.module.css'`.
- No upgrades or migrations to other packages required.

### Project Structure Notes

**Alignment with architecture:**
- `src/components/shared/Button.tsx` + `Button.module.css` + `Button.test.tsx` ✓ (architecture lines 404–406)
- `src/components/shared/ErrorScreen.tsx` ✓ (line 409)
- `src/components/shared/ErrorBoundary.tsx` is a NEW file not in the architecture's tree (architecture mentions ErrorBoundary in `App.tsx` directly on line 323, but a separate file is cleaner). **Acceptable deviation:** isolating the boundary keeps `App.tsx` minimal. Documented here.
- `src/lib/motionVariants.ts` ✓ (line 422)
- `src/content/uiStrings.ts` ✓ (line 437)

### References

- **Story source:** `_bmad-output/planning-artifacts/epics.md` § "Epic 1, Story 1.9"
- **PRD FRs:** FR41 (voice), FR49–FR52 (animation), FR58 (error screen)
- **Architecture:** §"Frontend Architecture" (Motion), §"Animation Pattern" (line 301), §"Error Handling Patterns" (line 322), §"What Agents MUST Do"
- **UX:** §"Button Hierarchy" (line 540), §"Copy / Voice Patterns" (line 546), §"Error Patterns" (line 578), §"Touch Target Patterns" (line 582)
- **Design tokens:** `src/styles/global.css` (Story 1.2)
- **Previous stories:** 1-7-storage-high-score-hook, 1-8-game-reducer-provider-state-hook

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code)

### Debug Log References

**RTL auto-cleanup was missing under non-global Vitest mode:**
- Symptom: Button tests `getByRole('button')` returned multiple elements — earlier tests' DOM nodes were still mounted when later tests rendered.
- Cause: RTL's auto-cleanup hook is only registered when Vitest globals are on (`globals: true`). We run with `globals: false` per architecture, so each test's `render()` leaks the previous mount.
- Fix: registered `afterEach(cleanup)` in `vitest.setup.ts`. Now applies to every test that calls `render()`.

### Completion Notes List

- **Installed `motion@12.40.0`** as runtime dependency.
- **`src/lib/motionVariants.ts`** — exports `fadeIn`, `fadeOut` (`Variants`) and `countUp` (`Transition`). Pure JS objects mirroring `--motion-base` (250ms) + `--ease-snappy` / `--ease-bounce` token values.
- **`src/content/uiStrings.ts`** — single source of UI copy: appTitle, 6 button labels, errorScreen heading+body, endScreen labels, `progress(round, total)` formatter. All strings in personality voice.
- **`src/components/shared/Button.tsx` + `Button.module.css`** — primary (≥56pt gold) + secondary (≥44pt pill); design tokens via `var(--...)`; semantic `<button>`, disabled state, `data-variant` marker, `aria-label` forwarding.
- **`src/components/shared/ErrorScreen.tsx`** — `role="alert"`, big ✗ + heading + body from uiStrings. No retry button per UX spec.
- **`src/components/shared/ErrorBoundary.tsx`** — React class component (function components can't catch errors in React 19). `getDerivedStateFromError` + `componentDidCatch` (logs to console.error). Renders `<ErrorScreen />` on caught error.
- **`src/App.tsx`** — wrapped existing Vite scaffold content in `<ErrorBoundary>`. Inner content unchanged; live site visually identical (Story 1.10 will replace inner content with screen switcher).
- **`vitest.setup.ts`** — added `afterEach(cleanup)` registration (RTL auto-cleanup workaround for `globals: false` mode).
- **Test count: 120** (was 107 → +3 motionVariants +6 Button +2 ErrorScreen +2 ErrorBoundary).
- **Bundle: 194.36 kB / gzip 61.24 kB** (was 193.35 / 60.67). Motion adds only ~0.6 kB gzipped — we import types only, so the runtime tree-shakes away. Real Motion runtime cost will appear in Story 1.10+ when `<AnimatePresence>` and `motion.div` get used.

### File List

- **NEW** `src/lib/motionVariants.ts`
- **NEW** `src/lib/motionVariants.test.ts`
- **NEW** `src/content/uiStrings.ts`
- **NEW** `src/components/shared/Button.tsx`
- **NEW** `src/components/shared/Button.module.css`
- **NEW** `src/components/shared/Button.test.tsx`
- **NEW** `src/components/shared/ErrorScreen.tsx`
- **NEW** `src/components/shared/ErrorScreen.module.css`
- **NEW** `src/components/shared/ErrorScreen.test.tsx`
- **NEW** `src/components/shared/ErrorBoundary.tsx`
- **NEW** `src/components/shared/ErrorBoundary.test.tsx`
- **MODIFIED** `src/App.tsx` (wrapped in `<ErrorBoundary>`)
- **MODIFIED** `vitest.setup.ts` (added afterEach cleanup)
- **MODIFIED** `package.json` (dep: motion ^12.40.0)
- **MODIFIED** `package-lock.json`

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-23 | Story created. First UI components ship: Button (primary/secondary), motionVariants (fadeIn/fadeOut/countUp), uiStrings (all copy in voice), ErrorScreen, ErrorBoundary. Wraps App in boundary; Vite landing page unchanged inside. Installs Motion library. | bmad-create-story (Claude Opus 4.7) |
| 2026-05-23 | Story implemented and shipped. 120 tests pass (107 prior + 13 new). All ACs satisfied. Bundle +0.6 kB gzipped (Motion tree-shaken to types). | bmad-dev-story (Claude Opus 4.7) |
