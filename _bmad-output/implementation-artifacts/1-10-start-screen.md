# Story 1.10: Start Screen

Status: review

## Story

As a player,
I want a clean, irreverent start screen with the SKILLDARES wordmark, one random pre-game message, and a single big START GAME button,
so that the personality lands in the first second and I can begin without reading any rules.

## Acceptance Criteria

1. **`src/components/start/StartScreen.tsx` exists and renders three things, in this order top-to-bottom:**
   - The SKILLDARES wordmark (display font, gold `--color-brand-primary`, large)
   - One random message from the `pre-game-encouragement` pool (50 messages)
   - The primary START GAME button (uses `<Button variant="primary">` from Story 1.9, label from `uiStrings.buttons.start`)

2. **Random message selection is uniform from the pool, per-mount:**
   - Picked once when the component mounts (via `useState(initializer)`) — does NOT re-pick on re-render
   - Uses the existing `pickMessage(messages, rng)` from `src/lib/picker.ts` with the project's `Rng` injection pattern
   - Component props: `{ onStart: () => void; messages?: string[]; rng?: Rng }` — both `messages` and `rng` default to the loaded pool + `defaultRng`; tests pass fixtures + a deterministic rng

3. **Tapping START GAME invokes `onStart`:**
   - StartScreen is decoupled from the reducer — it only calls `onStart()`. The screen switcher (Story 1.16) wires `onStart` to dispatch `START_GAME` with a freshly-selected question set.

4. **No instructional text, rules summary, or onboarding tutorial appears (FR43):**
   - Component renders exactly: wordmark + 1 message + 1 button. No "how to play", no rules list, no walkthrough.

5. **Pool is loaded + validated at module scope:**
   - `import rawPool from '../../../data/messages/pre-game-encouragement.json'` then `const pool = MessagePoolSchema.parse(rawPool)` at the top of the file
   - Validation failure → throws → the existing `<ErrorBoundary>` (Story 1.9) catches → `<ErrorScreen />` (FR58)

6. **Styling via `StartScreen.module.css`:**
   - Full-height column, centered both axes
   - All values via design tokens (`var(--...)`) — never hardcoded
   - Wordmark uses `--font-display`, `--color-brand-primary`, `var(--text-3xl)`
   - Message uses `--font-body`, `--color-text-primary` (or `--color-text-muted` if it reads better), `var(--text-lg)`
   - Generous vertical spacing per UX spec (`--space-6` or `--space-7` between elements)
   - Mobile-first; max-width capped per UX (~640px) on tablet+

7. **Subtle fade-in on mount via `motion/react`:**
   - Root element is a `<motion.div>` consuming `fadeIn` variants from `src/lib/motionVariants.ts` (`initial="initial"`, `animate="animate"`)
   - This wires the screen into the eventual `<AnimatePresence>` switcher in Story 1.16 with zero refactor

8. **`StartScreen.test.tsx` covers:**
   - Renders the wordmark text `"SKILLDARES"`
   - Renders a deterministic message when given a fixed rng + fixture pool
   - Renders the START GAME button label
   - Tapping the button calls `onStart` exactly once
   - Re-rendering does NOT re-pick the random message (verifies mount-once behavior)

9. **Build + tests pass:**
   - `npm test` exit 0
   - `npm run build` clean
   - Bundle grows by the StartScreen module + the imported JSON pool (~few kB)
   - Live site at `https://www.skilldares.com/` continues to render the Vite scaffold (StartScreen is NOT yet mounted in `App.tsx` — Story 1.16's job)

## Tasks / Subtasks

- [x] **Task 1: Pre-work safety check**
  - [x] Working tree clean
  - [x] On `main`, up to date with `origin/main`
  - [x] Verify Story 1.9 in place: `src/components/shared/Button.tsx`, `src/content/uiStrings.ts`, `src/lib/motionVariants.ts`; `npm test` shows 120 passing
  - [x] Create feature branch `story/1-10-start-screen`

- [x] **Task 2: Implement `src/components/start/StartScreen.tsx`**
  - [x] Create `src/components/start/` directory
  - [x] File contents per Dev Notes (module-scope pool import + parse, component with `useState` initializer for one-time pick, `<motion.div>` wrapper, semantic structure)
  - [x] Type-check clean: `npx tsc --noEmit`

- [x] **Task 3: Implement `src/components/start/StartScreen.module.css`**
  - [x] Full-height centered column, all values via tokens (see Dev Notes for exact CSS)

- [x] **Task 4: Implement `src/components/start/StartScreen.test.tsx`**
  - [x] Tests per Dev Notes (5 tests minimum)
  - [x] All pass: `npx vitest run src/components/start/StartScreen.test.tsx`

- [x] **Task 5: Full test suite + build verification**
  - [x] `npm test` all green (120 prior + 5 new)
  - [x] `npm run build` clean; note new bundle size

- [x] **Task 6: Commit + push + verify deploy**
  - [x] Stage src + spec separately, two commits per established pattern
  - [x] Fast-forward `main`, push, delete branch
  - [x] Verify Amplify build clean; live site unchanged (Vite scaffold)

## Dev Notes

### Why StartScreen takes `onStart` instead of dispatching directly

The architecture's screen-composition layer (`<App>` with `<GameProvider>` + screen switcher) lands in **Story 1.16**. Until then, no story has a render tree that contains both `<StartScreen>` and `<GameProvider>`. To keep this story shippable in isolation, StartScreen is decoupled from the reducer — it just calls `props.onStart`. Story 1.16 will wire `onStart` to:

```typescript
const { helpers } = useGameState();
const startGame = useCallback(() => {
  const questions = selectGameQuestions(allMC, allOrder, allSelect, defaultRng);
  helpers.startGame(questions);
}, [helpers]);

return <StartScreen onStart={startGame} />;
```

This separation also makes `StartScreen` reusable for future variants (e.g., a tutorial mode) without rewriting the click handler.

### Why `messages` + `rng` are injectable

The Story 1.6 `Rng` injection pattern keeps random behavior testable. Defaulting to the real pool + `defaultRng` means consumers don't have to know about either — but tests can pass fixtures.

```typescript
// production usage (Story 1.16):
<StartScreen onStart={startGame} />

// tests:
<StartScreen onStart={spy} messages={['fixed test message']} rng={() => 0} />
```

### Exact `src/components/start/StartScreen.tsx`

```typescript
import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../shared/Button';
import { uiStrings } from '../../content/uiStrings';
import { fadeIn } from '../../lib/motionVariants';
import { pickMessage } from '../../lib/picker';
import { defaultRng, type Rng } from '../../lib/rng';
import { MessagePoolSchema } from '../../lib/schemas/message.schema';
import rawPool from '../../../data/messages/pre-game-encouragement.json';
import styles from './StartScreen.module.css';

const defaultPool = MessagePoolSchema.parse(rawPool);

export type StartScreenProps = {
  onStart: () => void;
  /** Override the message pool — used by tests. Defaults to pre-game-encouragement. */
  messages?: string[];
  /** Override randomness — used by tests. Defaults to Math.random(). */
  rng?: Rng;
};

export function StartScreen({ onStart, messages = defaultPool, rng = defaultRng }: StartScreenProps) {
  // Pick once on mount so re-renders do not flicker through messages.
  const [message] = useState<string>(() => pickMessage(messages, rng));

  return (
    <motion.div
      className={styles.container}
      variants={fadeIn}
      initial="initial"
      animate="animate"
    >
      <h1 className={styles.wordmark}>{uiStrings.appTitle}</h1>
      <p className={styles.message}>{message}</p>
      <Button variant="primary" onClick={onStart}>
        {uiStrings.buttons.start}
      </Button>
    </motion.div>
  );
}
```

### Exact `src/components/start/StartScreen.module.css`

```css
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space-6);
  gap: var(--space-7);
  text-align: center;
  max-width: 640px;
  margin: 0 auto;
}

.wordmark {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  font-weight: var(--font-weight-black);
  color: var(--color-brand-primary);
  letter-spacing: 0.04em;
  margin: 0;
  line-height: 1;
}

.message {
  font-family: var(--font-body);
  font-size: var(--text-lg);
  color: var(--color-text-primary);
  line-height: 1.4;
  margin: 0;
  max-width: 480px;
}
```

### Exact `src/components/start/StartScreen.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, rerender as _ } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StartScreen } from './StartScreen';
import { uiStrings } from '../../content/uiStrings';

const fixtureMessages = ['Test message A', 'Test message B', 'Test message C'];

describe('StartScreen', () => {
  it('renders the SKILLDARES wordmark', () => {
    render(<StartScreen onStart={() => {}} messages={fixtureMessages} rng={() => 0} />);
    expect(screen.getByText(uiStrings.appTitle)).toBeTruthy();
  });

  it('renders a deterministic message when given a fixed rng', () => {
    // rng() => 0 → index Math.floor(0 * 3) = 0 → first message
    render(<StartScreen onStart={() => {}} messages={fixtureMessages} rng={() => 0} />);
    expect(screen.getByText('Test message A')).toBeTruthy();
  });

  it('renders the START GAME button label', () => {
    render(<StartScreen onStart={() => {}} messages={fixtureMessages} rng={() => 0} />);
    expect(screen.getByRole('button', { name: uiStrings.buttons.start })).toBeTruthy();
  });

  it('calls onStart exactly once when the button is tapped', async () => {
    const onStart = vi.fn();
    render(<StartScreen onStart={onStart} messages={fixtureMessages} rng={() => 0} />);
    await userEvent.click(screen.getByRole('button', { name: uiStrings.buttons.start }));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('keeps the same picked message across re-renders (one-time pick)', () => {
    // Use an rng whose values change every call. If the component re-picks on re-render,
    // the displayed message would change.
    let call = 0;
    const drifterRng = () => {
      const v = call / fixtureMessages.length;
      call++;
      return v;
    };

    const { rerender } = render(
      <StartScreen onStart={() => {}} messages={fixtureMessages} rng={drifterRng} />,
    );
    const firstMessage = fixtureMessages.find((m) => screen.queryByText(m));
    expect(firstMessage).toBeTruthy();

    rerender(<StartScreen onStart={() => {}} messages={fixtureMessages} rng={drifterRng} />);
    // Still the same message — useState initializer only runs once.
    expect(screen.getByText(firstMessage!)).toBeTruthy();
  });
});
```

> Note: the unused `rerender as _` import at the top is leftover noise — remove it; `rerender` comes from the destructured `render()` return value, not a top-level import. Cleaner version of the imports:
>
> ```typescript
> import { render, screen } from '@testing-library/react';
> ```

### Common LLM Mistakes to Avoid

- **Do NOT** mount `<GameProvider>` or call `useGameState` inside `StartScreen` — Story 1.16 wires composition; StartScreen takes `onStart` and is unaware of the reducer
- **Do NOT** put English text directly in JSX — every visible string must come from `uiStrings`
- **Do NOT** hardcode colors, sizes, fonts, or spacing — every CSS value via `var(--token)`
- **Do NOT** re-pick the random message on every render — use `useState(() => pickMessage(...))`, not bare `pickMessage(...)` in the function body
- **Do NOT** import the JSON inside the test — use the `messages` prop with inline fixtures (architecture line 319)
- **Do NOT** add a "How to Play" link, rules summary, or onboarding (FR43 explicitly forbids)
- **Do NOT** add `<AnimatePresence>` here — that's Story 1.16's screen switcher. StartScreen just declares its `fadeIn` variants and lets AnimatePresence (when added later) orchestrate transitions
- **Do NOT** call `MessagePoolSchema.parse(rawPool)` inside the component — do it at module scope so failures throw at import time (caught by ErrorBoundary)

### Testing Standards

- Vitest + jsdom (already configured)
- `render` + `screen` + `userEvent`
- `afterEach(cleanup)` from Story 1.9's `vitest.setup.ts` handles unmount
- Always pass `messages` + `rng` props in tests (deterministic, no JSON import in test files)
- Query by role + accessible name (`getByRole('button', { name: ... })`)

### Previous Story Intelligence

**From Story 1.9 (primitives + ErrorBoundary):**
- `Button` component takes `variant`, `onClick`, `children`, `aria-label`
- `uiStrings.buttons.start` = `'START GAME'`
- `motionVariants.fadeIn` is the standard fade-in `Variants` object
- `vitest.setup.ts` includes `afterEach(cleanup)` so each `render()` is isolated

**From Story 1.6 (pure modules):**
- `pickMessage(messages, rng)` throws on empty pool — fixture pools in tests must be non-empty
- `defaultRng` is `Math.random`; injected for testability

**From Story 1.5 (message content):**
- `data/messages/pre-game-encouragement.json` is 50 strings, validated against `MessagePoolSchema` (≥1 entry, non-empty strings)

### Git Intelligence

Last 4 commits on main:

```
5e0fb8f Add Story 1.9 dev spec to planning artifacts
cbb6996 Story 1.9: shared primitives + ErrorBoundary + Motion install
fac28b7 Add Story 1.8 dev spec to planning artifacts
83954cc Story 1.8: gameReducer + GameProvider + useGameState
```

Story 1.10 builds on `5e0fb8f`.

### Latest Tech Information

- **`motion/react` 12.40.0** — `motion.div` accepts `variants` + `initial` + `animate` props; works without `<AnimatePresence>` (just no exit animation)
- **CSS Modules** — class names imported from `*.module.css` are scoped; reference via `styles.wordmark` etc.

No new dependencies required for this story.

### Project Structure Notes

**Alignment with architecture:**
- `src/components/start/StartScreen.tsx` ✓ (architecture line 371)
- `src/components/start/StartScreen.module.css` ✓ (line 372)
- `src/components/start/StartScreen.test.tsx` ✓ (line 373)
- Uses `pickMessage`, `MessagePoolSchema`, `defaultRng` from established modules ✓

No deviations.

### References

- **Story source:** `_bmad-output/planning-artifacts/epics.md` § "Epic 1, Story 1.10"
- **PRD FRs:** FR42 (start-screen content), FR43 (no instructions), FR44 (Start tap → round 1)
- **Architecture:** §"Frontend Architecture", §"Content Loading Pattern" (line 288), §"Animation Pattern" (line 301)
- **UX:** §"Implementation Approach" line 398–406, §"User Journey Flows UJ-1"
- **Previous stories:** 1-5, 1-6, 1-9

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code)

### Debug Log References

None — implementation followed spec exactly. No surprises.

### Completion Notes List

- `src/components/start/StartScreen.tsx` ships per spec: wordmark + random pre-game message + START GAME button, wrapped in `motion.div` with `fadeIn` variants from Story 1.9.
- Pool loaded + Zod-validated at module scope (`MessagePoolSchema.parse(rawPool)`) — validation failures throw to the existing ErrorBoundary.
- Message picked once via `useState(() => pickMessage(messages, rng))` — re-renders don't flicker through messages. Tests verify this with a drifter rng.
- Component decoupled from reducer: takes `onStart: () => void` prop. Story 1.16 will wire `onStart` to `helpers.startGame(questions)`.
- `messages` + `rng` are injectable props (default to the loaded pool + `defaultRng`) — tests pass fixtures + deterministic rng with zero JSON imports in tests.
- **Test count: 125** (was 120 → +5 StartScreen).
- **Bundle: 194.36 kB / gzip 61.24 kB — unchanged.** StartScreen isn't imported by `App.tsx` yet, so Vite tree-shakes it out of production. Runtime cost appears in Story 1.16 when the screen switcher imports it.
- Live site (`https://www.skilldares.com/`) still renders the Vite scaffold — Story 1.16's job to swap that.

### File List

- **NEW** `src/components/start/StartScreen.tsx`
- **NEW** `src/components/start/StartScreen.module.css`
- **NEW** `src/components/start/StartScreen.test.tsx`

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-23 | Story created. First user-facing screen: wordmark + random pre-game message + START GAME. Decoupled from reducer via `onStart` prop — Story 1.16 wires dispatch. Pool import + parse at module scope so validation failures route to ErrorBoundary. | bmad-create-story (Claude Opus 4.7) |
| 2026-05-23 | Story implemented and shipped. 125 tests pass (120 prior + 5 new). All ACs satisfied. Bundle unchanged — StartScreen is tree-shaken until Story 1.16 imports it. | bmad-dev-story (Claude Opus 4.7) |
