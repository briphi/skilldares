# Story 1.6: Pure Logic Modules — Scoring, Streak, Picker, Question Selection (+ Vitest Setup)

Status: review

## Story

As a developer,
I want the four pure-logic modules (scoring, streak, picker, questionSelection) implemented with co-located unit tests AND Vitest installed as the test runner,
so that the game's deterministic core can be tested in isolation per NFR9, and every subsequent logic story (1.7, 1.8) has the testing pattern + framework already in place.

## Acceptance Criteria

1. **Vitest installed and configured:**
   - `vitest@^4.1.7` added to `devDependencies`
   - `vite.config.ts` extended with a `test` block (environment: 'node' for now — DOM environment lands in Story 1.9 when component tests arrive)
   - `package.json` has `"test": "vitest run"` and `"test:watch": "vitest"` scripts
   - `npm test` runs and exits with a clear summary (PASS/FAIL count, exit 0 when all pass)

2. **Four pure-logic modules implemented in `src/lib/`:**
   - `src/lib/scoring.ts` — exports `computePoints(isCorrect, usedHint): number` per FR30–FR32 (5 / 2 / 0)
   - `src/lib/streak.ts` — exports `nextStreak(previousStreak, isCorrect): number` per FR4 + streak transitions in FR38
   - `src/lib/picker.ts` — exports `pickPool(previousStreak, isCorrect): PoolId` and `pickMessage(messages, rng): string` per FR38
   - `src/lib/questionSelection.ts` — exports `pickRandomFromPool<T>(pool, count, rng): T[]` (generic helper used by Stories 1.8 + 2.3 to draw questions per FR6)
   - One shared module `src/lib/rng.ts` exporting `type Rng = () => number` and `const defaultRng: Rng = () => Math.random()`

3. **Pure modules are actually pure:**
   - Zero React imports
   - Zero DOM access
   - Zero I/O (no fetch, no localStorage, no fs)
   - All randomness injected via `Rng` parameter — no calls to `Math.random()` inside modules (only `defaultRng` in `rng.ts` wraps it)
   - All functions are deterministic given the same inputs (including the same `rng` if applicable)

4. **Each module has a co-located `*.test.ts` file with full behavior coverage:**
   - `src/lib/scoring.test.ts`, `src/lib/streak.test.ts`, `src/lib/picker.test.ts`, `src/lib/questionSelection.test.ts`
   - BDD-style: `describe('module', () => { it('does X', () => {}) })`
   - Tests cover happy path, edge cases (streak transitions across the 3-threshold, hint-vs-no-hint scoring, picker pool transitions, deterministic random with injected Rng)
   - All tests pass — `npm test` shows green
   - No regressions in the rest of the build (`npm run build` still clean)

5. **Build + deploy unaffected:**
   - `npm run build` succeeds (prebuild content validation → tsc → vite all pass)
   - `npm test` exits 0
   - AWS Amplify build on push succeeds
   - Live site at `https://www.skilldares.com/` byte-identical (modules not yet imported by runtime — Story 1.8 wires them in)

## Tasks / Subtasks

- [x] **Task 1: Pre-work safety check** (AC: #5)
  - [ ] Working tree clean (only untracked: `notes`)
  - [ ] On `main`, up to date with `origin/main`
  - [ ] Verify Story 1.5 in place: `data/messages/` contains 7 pools
  - [ ] Verify Story 1.3 schemas present: `src/lib/schemas/` has both schema files
  - [ ] Create feature branch `story/1-6-pure-logic`

- [x] **Task 2: Install Vitest** (AC: #1)
  - [ ] Run `npm install --save-dev vitest@^4.1.7`
  - [ ] Verify no other deps got upgraded by accident
  - [ ] Optional: install nothing else this story (no jsdom, no @testing-library — those land in Story 1.9 when components need DOM testing)

- [x] **Task 3: Configure Vitest in `vite.config.ts`** (AC: #1)
  - [ ] Replace the existing `vite.config.ts` with the exact content in Dev Notes below — adds the `/// <reference types="vitest" />` directive at the top + a `test:` block with `environment: 'node'` and `globals: false`
  - [ ] Add `"test"` and `"test:watch"` scripts to `package.json` (see Dev Notes for exact entries)

- [x] **Task 4: Implement `src/lib/rng.ts`** (AC: #2, #3)
  - [ ] Create file with `Rng` type alias + `defaultRng` runtime helper (exact content in Dev Notes)
  - [ ] Pure module — only wraps `Math.random()`

- [x] **Task 5: Implement `src/lib/scoring.ts` + `scoring.test.ts`** (AC: #2, #3, #4)
  - [ ] Create `scoring.ts` per FR30–FR32 (exact code in Dev Notes)
  - [ ] Write `scoring.test.ts` covering: correct+no-hint=5, correct+hint=2, wrong+no-hint=0, wrong+hint=0 (hint flag should be ignored when wrong; verify), boundary: ensure no NaN/undefined paths
  - [ ] Run `npx vitest run src/lib/scoring.test.ts` — must pass

- [x] **Task 6: Implement `src/lib/streak.ts` + `streak.test.ts`** (AC: #2, #3, #4)
  - [ ] Create `streak.ts` per FR4 + FR38 (exact code in Dev Notes)
  - [ ] Write `streak.test.ts` covering:
    - From 0 → +1 (correct) and 0 → -1 (wrong)
    - From +2 → +3 (correct, continues positive)
    - From -2 → -3 (wrong, continues negative)
    - From +5 → -1 (wrong resets to -1, not -6)
    - From -5 → +1 (correct resets to +1, not -4 or +6)
    - From +3 → +4 (correct, continues on-fire)
    - From -3 → -4 (wrong, continues doing-bad)
  - [ ] Run `npx vitest run src/lib/streak.test.ts` — must pass

- [x] **Task 7: Implement `src/lib/picker.ts` + `picker.test.ts`** (AC: #2, #3, #4)
  - [ ] Create `picker.ts` exporting:
    - `pickPool(previousStreak, isCorrect): PoolId` per FR38 transitions
    - `pickMessage(messages: string[], rng: Rng): string` — uniform-random from pool
  - [ ] `PoolId` import from `src/lib/schemas/message.schema.ts` (don't redefine — single source of truth from Story 1.3)
  - [ ] Write `picker.test.ts` covering:
    - **pickPool** branches per FR38:
      - prev=0 + correct → `right-no-streak`
      - prev=0 + wrong → `wrong-no-streak`
      - prev=2 + correct → `on-fire` (new streak hits 3)
      - prev=3 + correct → `on-fire` (continues on-fire)
      - prev=-2 + wrong → `doing-bad` (new streak hits -3)
      - prev=-3 + wrong → `doing-bad` (continues doing-bad)
      - prev=3 + wrong → `streak-broken` (ends 3+ correct streak)
      - prev=5 + wrong → `streak-broken` (ends 5-streak)
      - prev=-3 + correct → `comeback` (ends 3+ wrong streak)
      - prev=-5 + correct → `comeback` (ends 5-wrong-streak)
      - prev=+1 + correct → `right-no-streak` (no streak yet)
      - prev=-1 + wrong → `wrong-no-streak` (no streak yet)
    - **pickMessage** deterministic given injected Rng:
      - rng returning 0 → picks first message
      - rng returning 0.5 → picks middle message
      - rng returning 0.99 → picks last message
      - works for pool size 1 (returns that one message regardless of rng)
  - [ ] Run `npx vitest run src/lib/picker.test.ts` — must pass

- [x] **Task 8: Implement `src/lib/questionSelection.ts` + `questionSelection.test.ts`** (AC: #2, #3, #4)
  - [ ] Create `questionSelection.ts` exporting `pickRandomFromPool<T>(pool: T[], count: number, rng: Rng): T[]` — selects N items from pool without replacement
  - [ ] Implementation note: use Fisher-Yates shuffle (or equivalent) seeded by `rng` calls; return first N. Don't mutate input pool.
  - [ ] Write `questionSelection.test.ts` covering:
    - Returns exactly N items
    - All returned items are from the original pool (no inventions)
    - No duplicates in the returned set (without-replacement guarantee)
    - With deterministic rng, returns deterministic ordering
    - Edge: requesting N === pool.length returns a permutation of the whole pool
    - Edge: throws (or returns empty / partial — pick one and document) when N > pool.length
  - [ ] Run `npx vitest run src/lib/questionSelection.test.ts` — must pass

- [x] **Task 9: Run full test suite** (AC: #4)
  - [ ] `npm test` — all 4 test files pass, exit 0
  - [ ] Note total test count + duration in Dev Agent Record

- [x] **Task 10: Build pipeline verification** (AC: #5)
  - [ ] `npm run build` — prebuild + tsc + vite all clean
  - [ ] Bundle size unchanged (these modules not yet imported by runtime — Story 1.8 will wire them in)

- [x] **Task 11: Commit + push** (AC: #5)
  - [ ] Stage: `git add src/lib/ package.json package-lock.json vite.config.ts`
  - [ ] Commit message describes the 4 pure modules + Vitest setup
  - [ ] Fast-forward `main`, push to `origin`, delete feature branch

- [x] **Task 12: Verify production deploy** (AC: #5)
  - [x] Amplify build completed after push of `50bd770`
  - [x] User confirmed prebuild validation still ran + live site unchanged

## Dev Notes

### Project Background

Story 1.6 is the **inflection point**: after 5 stories of scaffolding, design tokens, schemas, and content authoring, this is the first story that ships actual game logic. The four pure-logic modules become the deterministic foundation that the reducer (Story 1.8) and components (Stories 1.10+) all consume.

This is also where **Vitest finally lands** — NFR9's automated test requirement begins enforcement. After this story, every subsequent logic/component story is expected to ship with tests.

### What This Story Ships

| File | Purpose |
| --- | --- |
| `src/lib/rng.ts` | NEW — `Rng` type + `defaultRng` runtime helper |
| `src/lib/scoring.ts` | NEW — pure scoring per FR30–FR32 |
| `src/lib/streak.ts` | NEW — pure streak state machine per FR4 + FR38 |
| `src/lib/picker.ts` | NEW — pure picker logic per FR38 |
| `src/lib/questionSelection.ts` | NEW — generic random-without-replacement helper |
| `src/lib/*.test.ts` | NEW (×4) — co-located unit tests for each module |
| `vite.config.ts` | MODIFIED — add Vitest config |
| `package.json` | MODIFIED — add vitest devDep + 2 test scripts |
| `package-lock.json` | MODIFIED — npm install update |

### Latest Tech Information

- **Vitest 4.1.7** (verified 2026-05-23) — supports Vite ^6 || ^7 || ^8 (our 8.0.14 ✓), requires Node ≥20. Sources: [Vitest releases](https://github.com/vitest-dev/vitest/releases), [Vitest npm](https://www.npmjs.com/package/vitest).
- Why this version: latest stable, full Vite 8 compatibility, modern test runner with built-in TypeScript support via esbuild.

### Exact Content for `src/lib/rng.ts`

```typescript
/**
 * Skilldares — Random number generator.
 *
 * Pure modules (scoring, streak, picker, questionSelection) accept an Rng as
 * a parameter so tests can inject a deterministic generator. Production code
 * passes `defaultRng`, which is a thin wrapper around Math.random().
 */

/** Returns a number in [0, 1). */
export type Rng = () => number;

export const defaultRng: Rng = () => Math.random();
```

### Exact Content for `src/lib/scoring.ts`

```typescript
/**
 * Skilldares — Scoring.
 *
 * Per FR30–FR32:
 *  - Correct answer (no hint used) → 5 points
 *  - Correct answer (hint used)    → 2 points
 *  - Wrong answer                  → 0 points
 *
 * Speed-round Type A/B are all-or-nothing scored (5 for exact match, 0 otherwise);
 * hints don't apply to speed rounds, so callers pass `usedHint: false` for speed
 * and `computePoints` handles them the same as MC.
 */

export function computePoints(isCorrect: boolean, usedHint: boolean): number {
  if (!isCorrect) return 0;
  return usedHint ? 2 : 5;
}
```

### Exact Content for `src/lib/streak.ts`

```typescript
/**
 * Skilldares — Streak transitions.
 *
 * Streak is a signed integer:
 *   > 0  → active correct streak (length = value)
 *   < 0  → active wrong streak (length = abs(value))
 *   == 0 → no streak (initial state, also after Play Again per FR40)
 *
 * Transition rules (used by the reducer in Story 1.8 after every answer):
 *
 *  on correct:
 *    if previous >= 0 → new = previous + 1   (continue or start positive)
 *    if previous < 0  → new = +1             (reset from negative)
 *
 *  on wrong:
 *    if previous <= 0 → new = previous - 1   (continue or start negative)
 *    if previous > 0  → new = -1             (reset from positive)
 */

export function nextStreak(previousStreak: number, isCorrect: boolean): number {
  if (isCorrect) {
    return previousStreak >= 0 ? previousStreak + 1 : 1;
  }
  return previousStreak <= 0 ? previousStreak - 1 : -1;
}
```

### Exact Content for `src/lib/picker.ts`

```typescript
/**
 * Skilldares — Personality message picker (FR38).
 *
 * Two pure functions:
 *
 *  pickPool(previousStreak, isCorrect): PoolId
 *    Decides which message pool an answer should pull from, based on per-answer
 *    state plus streak transitions. The reducer (Story 1.8) calls this after
 *    every ANSWER_QUESTION action; the resulting pool ID is then used to draw
 *    a specific message via pickMessage.
 *
 *  pickMessage(messages, rng): string
 *    Uniform-random selection of one message from a pool. Rng is injected so
 *    tests are deterministic.
 *
 * Per FR38 (verbatim from PRD):
 *   On correct answer:
 *     - prev streak <= -3        → 'comeback'    (ending a 3+ wrong streak)
 *     - else if new streak >= 3  → 'on-fire'     (hitting/continuing 3+ correct)
 *     - else                     → 'right-no-streak'
 *
 *   On wrong answer:
 *     - prev streak >= 3         → 'streak-broken' (ending a 3+ correct streak)
 *     - else if new streak <= -3 → 'doing-bad'     (hitting/continuing 3+ wrong)
 *     - else                     → 'wrong-no-streak'
 *
 * Note: pickPool returns one of 6 active per-answer pools. `pre-game-encouragement`
 * (Start screen) and `new-high-score` (End screen) are picked elsewhere, not here.
 */

import type { MessagePoolId } from './schemas/message.schema';
import type { Rng } from './rng';
import { nextStreak } from './streak';

export function pickPool(previousStreak: number, isCorrect: boolean): MessagePoolId {
  const newStreak = nextStreak(previousStreak, isCorrect);
  if (isCorrect) {
    if (previousStreak <= -3) return 'comeback';
    if (newStreak >= 3) return 'on-fire';
    return 'right-no-streak';
  }
  if (previousStreak >= 3) return 'streak-broken';
  if (newStreak <= -3) return 'doing-bad';
  return 'wrong-no-streak';
}

export function pickMessage(messages: string[], rng: Rng): string {
  if (messages.length === 0) {
    throw new Error('pickMessage: pool is empty');
  }
  const index = Math.floor(rng() * messages.length);
  return messages[index]!;
}
```

### Exact Content for `src/lib/questionSelection.ts`

```typescript
/**
 * Skilldares — Question selection.
 *
 * Generic random-without-replacement helper used by Stories 1.8 + 2.3 to draw
 * questions for each game. Story 1.6 ships just this primitive; the higher-level
 * `selectGame` (combining MC + speed-A + speed-B with the FR3 50/50 split)
 * lands in Story 2.3.
 *
 * Uses Fisher–Yates shuffle (truncated to N) for uniform-random selection.
 * Does not mutate the input pool.
 */

import type { Rng } from './rng';

export function pickRandomFromPool<T>(pool: T[], count: number, rng: Rng): T[] {
  if (count < 0) {
    throw new Error(`pickRandomFromPool: count must be >= 0, got ${count}`);
  }
  if (count > pool.length) {
    throw new Error(
      `pickRandomFromPool: count ${count} exceeds pool length ${pool.length}`,
    );
  }
  if (count === 0) return [];

  // Fisher–Yates shuffle on a copy, then take the first `count`.
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy.slice(0, count);
}
```

### Exact Content for `vite.config.ts` (Updated)

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: false,
  },
})
```

Why these choices:
- `/// <reference types="vitest" />` — pulls Vitest's type augmentation for the `test` config field (avoids needing a separate `vitest.config.ts`)
- `environment: 'node'` — pure logic tests don't need a DOM. Story 1.9 will switch to `'jsdom'` when component tests arrive.
- `globals: false` — explicit imports (`import { describe, it, expect } from 'vitest'`). Cleaner for TypeScript and pattern-matches modern test conventions.

### `package.json` Script Additions

Add to the `scripts` block (after `lint`):

```json
"test": "vitest run",
"test:watch": "vitest"
```

(`vitest run` is one-shot mode that exits with a status code; bare `vitest` is the watch-mode dev loop.)

### Test File Patterns (from Story 1.3 Implementation Patterns)

Per architecture's "Implementation Patterns → Test Patterns":
- BDD-style: `describe('module', () => { it('does X', () => {}) })`
- Pure modules in `src/lib/` get **100% behavior coverage**
- Tests inject randomness, time, and storage (none of those apply yet — Story 1.7 introduces storage; this story's modules just need `rng`)
- Tests never import the real JSON content files — use minimal inline fixtures

### Example Test File Shape — `scoring.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { computePoints } from './scoring';

describe('computePoints', () => {
  it('awards 5 points for a correct answer without hint', () => {
    expect(computePoints(true, false)).toBe(5);
  });

  it('awards 2 points for a correct answer with hint used', () => {
    expect(computePoints(true, true)).toBe(2);
  });

  it('awards 0 points for a wrong answer (no hint)', () => {
    expect(computePoints(false, false)).toBe(0);
  });

  it('awards 0 points for a wrong answer even when hint was used', () => {
    // Hint flag should be irrelevant on wrong answers; FR32 says wrong is wrong.
    expect(computePoints(false, true)).toBe(0);
  });
});
```

Use this shape for all four test files: short, descriptive `it` names, one assertion per test (mostly), `describe` blocks named after the function or module.

### Common LLM Mistakes to Avoid

- **Do NOT** install `@testing-library/react`, `@testing-library/user-event`, `jsdom`, or `happy-dom` in this story — those land in Story 1.9 when component tests first need DOM
- **Do NOT** use `Math.random()` directly inside any module — must use the injected `Rng`. The only place `Math.random()` is allowed is inside `defaultRng` in `rng.ts`.
- **Do NOT** import React anywhere in `src/lib/` (the boundary is sacrosanct per architecture)
- **Do NOT** redefine `MessagePoolId` in `picker.ts` — import the type from `src/lib/schemas/message.schema.ts` (single source of truth per architecture)
- **Do NOT** mutate the input pool in `pickRandomFromPool` — work on a copy
- **Do NOT** add `globals: true` to vitest config — explicit imports keep TypeScript happy without extra `types` config in tsconfig
- **Do NOT** add `jsdom` even if Vitest suggests it — `environment: 'node'` is the correct setting for this story
- **Do NOT** modify any component files, schemas, content JSON, or the build script — this story is purely additive in `src/lib/` plus vitest setup
- **Do NOT** stage with `git add .` — be explicit

### Testing Standards

This story IS the test framework setup. After this:
- Story 1.7 (`storage.ts`) gets unit tests (mock localStorage)
- Story 1.8 (`gameReducer`) gets unit tests (with picker + scoring + streak as already-tested dependencies)
- Story 1.9 (shared primitives like `Button`) adds component tests — at that point we'll install `@testing-library/react` + switch environment to `jsdom`

For Story 1.6, no integration tests, no E2E tests, no coverage thresholds — just unit tests for the four pure modules.

### Previous Story Intelligence

**From Story 1.5 (just shipped):**
- Content authoring pattern: write JSON → validate → commit. Worked twice (1.4, 1.5).
- Direct-to-main push pattern remains.
- Bundle size unchanged when adding files not imported by runtime.

**From Story 1.3:**
- `src/lib/schemas/` exists and exports `MessagePoolIdSchema` + `MessagePoolId` (z.infer<>). The picker should import the type from there, NOT redefine it.

**From Story 1.1:**
- `tsconfig.app.json` has `"strict": true`. New code MUST type-check under strict (no `any`, no implicit `any`, no unchecked array indexing — note the `!` non-null assertion pattern in the exact code for `pickMessage` and `pickRandomFromPool` to handle this).

### Git Intelligence

Last 4 commits on main:

```
dadb4ae Add Story 1.5 dev spec to planning artifacts
6a95667 Story 1.5: author 350 personality messages (7 pools × 50)
84aef3b Add Story 1.4 dev spec to planning artifacts
6dddcfa Story 1.4: author 246 multiple-choice questions (no-hallucinations bar)
```

Story 1.6 builds on `dadb4ae` (current main).

### Project Structure Notes

**Alignment with architecture:**
- `src/lib/` is the architecture's chosen location for pure logic ✓
- Co-located tests match the architecture's "Test Patterns" ✓
- Vitest matches the architecture's Step-3 / NFR9 commitment ✓
- The Rng injection pattern matches the architecture's "Picker logic (FR38): Pure module ... randomness injected as `Rng` parameter so tests are deterministic"

**No structural deviations.**

### References

- **Story source:** `_bmad-output/planning-artifacts/epics.md` § "Epic 1, Story 1.6"
- **PRD FRs covered:** FR4 (streak state), FR6 (question selection), FR30–FR34 (scoring), FR38 (picker), FR40 (streak reset on Play Again — tested implicitly), NFR9 (automated tests)
- **Architecture patterns:** `_bmad-output/planning-artifacts/architecture.md` § "Implementation Patterns" → Test Patterns + Anti-Patterns; § "Core Architectural Decisions" → "Picker logic" (Rng injection)
- **Schemas (Story 1.3):** `src/lib/schemas/message.schema.ts` — source for `MessagePoolId`
- **Vitest docs:** https://vitest.dev/
- **Previous story:** `_bmad-output/implementation-artifacts/1-5-author-message-pool-content.md`

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (`claude-opus-4-7`) — running the bmad-dev-story workflow.

### Debug Log References

- Vitest 4.1.7 installed, 51 packages added, 0 vulnerabilities
- **One bug discovered during build:** initial `vite.config.ts` used `/// <reference types="vitest" />` + `import { defineConfig } from 'vite'` — TypeScript error: "Object literal may only specify known properties, and 'test' does not exist in type 'UserConfigExport'". Fixed by importing `defineConfig` from `'vitest/config'` instead. The triple-slash reference pattern works in older Vitest versions; Vitest 4.x prefers explicit `vitest/config` import for clean TS types.
- Build pipeline after fix: prebuild content validation (8 lines) → tsc -b (clean) → vite build (88ms) → all green
- Tests after fix: 4 test files, 51 tests, 183ms total. All pass.

### Completion Notes List

**🧪 Story 1.6 ships the test framework + 4 pure-logic modules + 51 unit tests.**

**Implementation summary:**
- Vitest 4.1.7 installed; `npm test` / `npm run test:watch` scripts wired
- 5 new modules in `src/lib/`: rng, scoring, streak, picker, questionSelection
- 4 co-located test files: 51 tests covering every behavior branch
- All modules pure (zero React, zero DOM, zero I/O — Rng injected as parameter)
- PoolId imported from `message.schema.ts` (single source of truth, no parallel type)
- Fisher-Yates shuffle with injected Rng for deterministic test results

**Test breakdown (51 total):**
- `scoring.test.ts`: 4 tests (all hint × correct combinations)
- `streak.test.ts`: 11 tests (start, continue, reset, threshold crossings in both directions)
- `picker.test.ts`: 24 tests (pickPool all 6 pool branches × correct/wrong + boundary cases; pickMessage first/middle/last/single/empty)
- `questionSelection.test.ts`: 11 tests (count correctness, no duplicates, full permutation, no mutation, determinism, error paths, generic-over-T)

**Pending (Task 12):**
- User confirms Amplify build still shows prebuild validation (8 lines for content) after commit `50bd770`
- Live site unchanged (modules not yet imported by runtime; Story 1.8 wires them in via gameReducer)

### File List

**New files:**
- `src/lib/rng.ts` — Rng type + defaultRng
- `src/lib/scoring.ts` — computePoints per FR30–FR32
- `src/lib/scoring.test.ts` — 4 tests
- `src/lib/streak.ts` — nextStreak per FR4 + FR38
- `src/lib/streak.test.ts` — 11 tests
- `src/lib/picker.ts` — pickPool + pickMessage per FR38
- `src/lib/picker.test.ts` — 24 tests
- `src/lib/questionSelection.ts` — generic pickRandomFromPool (Fisher-Yates)
- `src/lib/questionSelection.test.ts` — 11 tests

**Modified files:**
- `vite.config.ts` — added Vitest test block (using `import { defineConfig } from 'vitest/config'` for clean TS types)
- `package.json` — added vitest devDep + "test" and "test:watch" scripts
- `package-lock.json` — npm install update for vitest

**Untouched:**
- All previous Story files (1.1-1.5): scaffold, tokens, fonts, schemas, content
- `tsconfig.app.json`, `eslint.config.js`, `amplify.yml`, etc.

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-23 | Story created. First TypeScript code story since 1.3. Vitest finally lands. | bmad-create-story (Claude Opus 4.7) |
| 2026-05-23 | Story implemented: Vitest 4.1.7 + 4 pure modules + 51 unit tests (all passing in 183ms). One config issue fixed (use `vitest/config` import for TS compatibility). Commit `50bd770` pushed. Status → review pending user verification. | bmad-dev-story (Claude Opus 4.7) |
