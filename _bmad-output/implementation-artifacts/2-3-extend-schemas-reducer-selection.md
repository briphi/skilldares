# Story 2.3: Extend Schemas + Game State + Question Selection for Speed Rounds

Status: review

## Story

As a developer,
I want the schemas, reducer, and selection logic extended to support full 30-round games with mixed question types,
so that Stories 2.6/2.7 (speed-type components) can plug in cleanly and Story 2.8 can flip the production build to the 30-round game without further plumbing.

## ⚠️ Includes a latent-bug fix from Story 1.17

While auditing for this story I found that the reducer's `TOTAL_ROUNDS = 30` constant is used as a hard cap in `ADVANCE_TO_NEXT` and `FINISH_GAME` guards. Epic 1's `selectEpic1Game` ships **15** questions, but the reducer expects 30 — so `FINISH_GAME`'s check `state.roundIndex === TOTAL_ROUNDS - 1` (== 29) never matches on Epic 1 builds. Players who actually finish 15 rounds would be stuck on the feedback overlay. (Smoke test didn't catch it because nobody played all 15 rounds yet.)

**Fix included in this story:** replace `TOTAL_ROUNDS` hardcode references in the reducer with `state.questions.length`. The constant stays exported for docs / tests but is no longer the source of truth for game length.

## Acceptance Criteria

1. **`src/lib/schemas/question.schema.ts` extended:**
   - Add `GameQuestionSchema` — a Zod discriminated union over the three types using a wrapper-object shape: `{ type: 'mc' | 'order' | 'select', question: <inner schema> }`
   - Export `type GameQuestion = z.infer<typeof GameQuestionSchema>` so other modules import the type from the schema (single source of truth)
   - Inner schemas (`MultipleChoiceQuestionSchema`, `SpeedOrderQuestionSchema`, `SpeedSelectQuestionSchema`) and the three pool schemas remain unchanged — the JSON content files stay flat (no `type` field; they're single-type pools).

2. **`src/lib/gameReducer.ts` updated:**
   - Remove the locally-defined `GameQuestion` type; import from `./schemas/question.schema`
   - Replace `TOTAL_ROUNDS - 1` references inside reducer cases with `state.questions.length - 1` (the latent-bug fix). The `TOTAL_ROUNDS = 30` export stays as a documentary constant + for tests that still use full-length games.
   - No other behavior change.

3. **`src/lib/questionSelection.ts` extended:**
   - **Move** `shuffleMCQuestion` from `src/lib/gameSetup.ts` to here (it's a question-selection concern, not a game-setup concern). Update the existing import in `gameSetup.ts`.
   - Add `selectGameQuestions(allMC, allOrder, allSelect, rng): GameQuestion[]`:
     - Picks 15 MC questions (shuffled options per the existing `shuffleMCQuestion` pattern)
     - Picks 7 or 8 Speed Type A + the complement (15 total speed) — random per-game which one gets 8 via `rng() < 0.5`
     - Returns `GameQuestion[]` of length 30: rounds 1-15 (indexes 0-14) are MC in random order, rounds 16-30 (indexes 15-29) are speed in random interleaved order (uses `pickRandomFromPool(speedRounds, speedRounds.length, rng)` to shuffle in place — Fisher-Yates already proven)
   - Per FR2 (rounds 1-15 MC, 16-30 speed) and FR3 (speed 50/50 ±1).

4. **`src/lib/questionSelection.test.ts` extended:**
   - New tests for `selectGameQuestions`:
     - Returns exactly 30 questions
     - First 15 are all `type === 'mc'`
     - Last 15 are all `type === 'order'` or `type === 'select'`
     - Speed-round mix: count of A + count of B = 15; each is 7 or 8 (never less, never more)
     - Deterministic with fixed rng (same rng → same output)
     - Includes BOTH speed types in the output (no all-A or all-B by accident with reasonable rng)
   - If `shuffleMCQuestion` tests moved here from `gameSetup.test.ts`, keep them passing.

5. **`src/lib/gameReducer.test.ts` extended:**
   - Add a test confirming the round-length fix: a fixture game with N < 30 questions advances correctly through all N rounds and FINISH_GAME fires on the last one.
   - Optionally update the existing "short mini-game flow" test if needed; it should still pass since it uses `TOTAL_ROUNDS = 30` fixtures.

6. **`src/lib/gameSetup.ts` minor update:**
   - Replace local `shuffleMCQuestion` with an import from `questionSelection.ts` (it was moved)
   - `selectEpic1Game` continues to exist and continues to work (still picks 15 MC). It will be retired in Story 2.8 when `App.tsx` swaps to `selectGameQuestions`. Until then, it's the production entry point.

7. **App.tsx unchanged.** Production keeps using `selectEpic1Game` until Story 2.8's integration. The Story 2.4-2.7 speed components ship in isolation; rounds 16-30 placeholder in `GameScreen` (`"Speed round coming soon"`) still applies because `App.tsx` never feeds in a 30-question array.

8. **Build + tests pass:**
   - `npm test` exit 0 (199 prior + new tests)
   - `npm run build` clean (Zod's discriminated union compiles fine)
   - Bundle change minimal — `GameQuestionSchema` adds a tiny Zod schema; no new content imports

## Tasks / Subtasks

- [x] **Task 1: Pre-work safety check**
  - [x] Working tree clean; on `main`; up to date
  - [x] Confirm 199 tests pass; build clean
  - [x] Create branch `story/2-3-extend-schemas-reducer-selection`

- [x] **Task 2: Extend `src/lib/schemas/question.schema.ts`**
  - [x] Add `GameQuestionSchema` (discriminated union via wrapper objects)
  - [x] Export `type GameQuestion = z.infer<typeof GameQuestionSchema>`
  - [x] Type-check clean

- [x] **Task 3: Update `src/lib/gameReducer.ts`**
  - [x] Remove local `GameQuestion` type definition
  - [x] Import `GameQuestion` from `./schemas/question.schema`
  - [x] Inside the reducer, change `TOTAL_ROUNDS - 1` → `state.questions.length - 1` in BOTH `ADVANCE_TO_NEXT` and `FINISH_GAME` cases
  - [x] Keep `TOTAL_ROUNDS = 30` exported (docs/tests still reference it)
  - [x] Type-check clean

- [x] **Task 4: Move `shuffleMCQuestion` from `gameSetup.ts` to `questionSelection.ts`**
  - [x] Cut the function (including its docstring) from `gameSetup.ts`
  - [x] Paste into `questionSelection.ts` with the same export
  - [x] Update `gameSetup.ts`'s `selectEpic1Game` to import from `./questionSelection`
  - [x] Move the relevant `shuffleMCQuestion` tests from `gameSetup.test.ts` → `questionSelection.test.ts`

- [x] **Task 5: Implement `selectGameQuestions` in `questionSelection.ts`**
  - [x] Per Dev Notes — picks 15 MC + 7/8 split for speed types, returns 30 GameQuestions
  - [x] Uses `pickRandomFromPool` for both selection and shuffling of speed rounds
  - [x] Type-check clean

- [x] **Task 6: Add tests for `selectGameQuestions`**
  - [x] Per AC #4 — 6 tests minimum covering length, type ordering, A/B split, determinism, mixed-type presence

- [x] **Task 7: Add gameReducer test for variable round count**
  - [x] Per AC #5 — confirm short games (e.g., 5 questions) advance + finish correctly

- [x] **Task 8: Full test + build**
  - [x] `npm test` — all green
  - [x] `npm run build` — clean

- [x] **Task 9: Commit + push to main**
  - [x] One commit for the implementation; second for the spec
  - [x] Fast-forward main, push, delete branch

## Dev Notes

### Exact `GameQuestionSchema` Addition

Append to `src/lib/schemas/question.schema.ts`:

```typescript
// ---------- Game-level discriminated union (in-memory game state) ----------

/**
 * Wrapper schema matching the in-game representation of a question.
 * Content JSON files are flat single-type pools (multiple-choice.json,
 * speed-order.json, speed-select.json); this schema describes how those
 * questions appear in the reducer's GameState.questions array — wrapped
 * with a `type` discriminator so the UI can route to QuestionMC /
 * QuestionOrder / QuestionSelect at render time.
 */
export const GameQuestionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('mc'), question: MultipleChoiceQuestionSchema }),
  z.object({ type: z.literal('order'), question: SpeedOrderQuestionSchema }),
  z.object({ type: z.literal('select'), question: SpeedSelectQuestionSchema }),
]);

export type GameQuestion = z.infer<typeof GameQuestionSchema>;
```

### Exact `selectGameQuestions` Function

Add to `src/lib/questionSelection.ts`:

```typescript
import type { GameQuestion } from './schemas/question.schema';
import type {
  MultipleChoiceQuestion,
  SpeedOrderQuestion,
  SpeedSelectQuestion,
} from './schemas/question.schema';

const MC_COUNT = 15;
const TOTAL_SPEED = 15;

/**
 * Builds a full 30-round game.
 *
 * Per FR2: rounds 1-15 are MC, rounds 16-30 are speed.
 * Per FR3: speed rounds split ~50/50 (±1) between Type A (drag-order) and
 *          Type B (multi-select).
 *
 * Each MC question's options are shuffled (per FR9.1) so the correct
 * answer doesn't always land in the same quadrant.
 *
 * Speed-round mix is interleaved randomly within rounds 16-30 (no
 * deterministic A-then-B order — the player shouldn't be able to predict
 * type from round number).
 */
export function selectGameQuestions(
  allMC: MultipleChoiceQuestion[],
  allOrder: SpeedOrderQuestion[],
  allSelect: SpeedSelectQuestion[],
  rng: Rng,
): GameQuestion[] {
  // Random 7/8 or 8/7 split for the 15 speed rounds.
  const speedACount = rng() < 0.5 ? 7 : 8;
  const speedBCount = TOTAL_SPEED - speedACount;

  // MC rounds: pick 15 + shuffle each question's options.
  const mcSelected = pickRandomFromPool(allMC, MC_COUNT, rng);
  const mcRounds: GameQuestion[] = mcSelected.map((q) => ({
    type: 'mc' as const,
    question: shuffleMCQuestion(q, rng),
  }));

  // Speed rounds: pick N each, wrap, interleave randomly.
  const speedASelected = pickRandomFromPool(allOrder, speedACount, rng);
  const speedBSelected = pickRandomFromPool(allSelect, speedBCount, rng);
  const speedWrapped: GameQuestion[] = [
    ...speedASelected.map((q) => ({ type: 'order' as const, question: q })),
    ...speedBSelected.map((q) => ({ type: 'select' as const, question: q })),
  ];
  // Shuffle by drawing all of them via pickRandomFromPool with count=length.
  const speedShuffled = pickRandomFromPool(speedWrapped, speedWrapped.length, rng);

  return [...mcRounds, ...speedShuffled];
}
```

### Exact Reducer Changes

In `src/lib/gameReducer.ts`:

**Remove this local type definition:**

```typescript
// DELETE these lines
export type GameQuestion =
  | { type: 'mc'; question: MultipleChoiceQuestion }
  | { type: 'order'; question: SpeedOrderQuestion }
  | { type: 'select'; question: SpeedSelectQuestion };
```

**Update imports:**

```typescript
// ADD GameQuestion to the import; keep the individual types for any other uses
import type {
  GameQuestion,
  MultipleChoiceQuestion,
  SpeedOrderQuestion,
  SpeedSelectQuestion,
} from './schemas/question.schema';
```

Wait — `MultipleChoiceQuestion` etc. aren't used directly inside gameReducer.ts anymore once `GameQuestion` is imported from the schema (the type defs were only used to define the local discriminated union). Remove those individual imports too. Just:

```typescript
import type { GameQuestion } from './schemas/question.schema';
```

(Re-export `GameQuestion` from gameReducer.ts if other code currently imports it from there — check via `grep "from.*gameReducer.*GameQuestion"`.)

**Update the two guards (the bug fix):**

```typescript
case 'ADVANCE_TO_NEXT': {
  if (state.phase !== 'feedback') return state;
  if (state.roundIndex >= state.questions.length - 1) return state;  // was: TOTAL_ROUNDS - 1
  return { ... };
}

case 'FINISH_GAME': {
  if (state.phase !== 'feedback') return state;
  if (state.roundIndex !== state.questions.length - 1) return state;  // was: TOTAL_ROUNDS - 1
  return { ...state, phase: 'end' };
}
```

`TOTAL_ROUNDS = 30` stays exported for docs and tests.

### Why the Reducer Doesn't Need to Know Answer Payload Shapes

The epic AC wording ("treat speed-round answer payloads (order array, selection set) correctly") suggested the reducer might need to accept richer payloads (order arrays, selection sets) and compute correctness internally. We're NOT doing that — keeping the reducer thin per existing pattern.

The current `ANSWER_QUESTION` action takes `{ isCorrect: boolean }`. The correctness computation lives in the components:
- `QuestionMC` (Story 1.13): `index === question.correctIndex`
- `QuestionOrder` (Story 2.6): `submittedOrder.every((item, i) => item === question.items[i].name)` (or similar)
- `QuestionSelect` (Story 2.7): `setsAreEqual(selectedSet, new Set(question.correctSet))`

Each component knows the answer shape AND the correctness algorithm for its question type. The reducer just receives the boolean. This is cleaner than dispatching raw answer data and forcing the reducer to depend on three different correctness checkers.

The "treat ... correctly" wording is interpreted as "the existing payload shape works for all three types" — which it does.

### Test Pattern: `selectGameQuestions`

```typescript
describe('selectGameQuestions', () => {
  const mc = Array.from({ length: 20 }, (_, i) => makeMCFixture(i));
  const order = Array.from({ length: 10 }, (_, i) => makeOrderFixture(i));
  const select = Array.from({ length: 10 }, (_, i) => makeSelectFixture(i));

  it('returns exactly 30 questions', () => {
    const game = selectGameQuestions(mc, order, select, () => 0.5);
    expect(game).toHaveLength(30);
  });

  it('first 15 are all type=mc', () => {
    const game = selectGameQuestions(mc, order, select, () => 0.5);
    for (let i = 0; i < 15; i++) {
      expect(game[i]!.type).toBe('mc');
    }
  });

  it('last 15 are all type=order or type=select', () => {
    const game = selectGameQuestions(mc, order, select, () => 0.5);
    for (let i = 15; i < 30; i++) {
      expect(['order', 'select']).toContain(game[i]!.type);
    }
  });

  it('speed rounds contain 7 or 8 of each type (FR3: 50/50 ±1)', () => {
    const game = selectGameQuestions(mc, order, select, () => 0.5);
    const speed = game.slice(15);
    const aCount = speed.filter((g) => g.type === 'order').length;
    const bCount = speed.filter((g) => g.type === 'select').length;
    expect(aCount + bCount).toBe(15);
    expect([7, 8]).toContain(aCount);
    expect([7, 8]).toContain(bCount);
  });

  it('is deterministic for a given rng (same seed → same output)', () => {
    const rng = () => 0.3;
    const game1 = selectGameQuestions(mc, order, select, rng);
    const game2 = selectGameQuestions(mc, order, select, rng);
    // Compare type sequences (the actual question content may pass through reference;
    // the SEQUENCE of types is the determinism guarantee).
    expect(game1.map((g) => g.type)).toEqual(game2.map((g) => g.type));
  });

  it('includes both speed types in the output (no all-A or all-B)', () => {
    // With rng()=>0.5: aCount=8, bCount=7. With rng()=>0.4: aCount=7, bCount=8.
    // Both cases produce a mix. Verify with rng=>0.5.
    const game = selectGameQuestions(mc, order, select, () => 0.5);
    const speed = game.slice(15);
    const hasA = speed.some((g) => g.type === 'order');
    const hasB = speed.some((g) => g.type === 'select');
    expect(hasA).toBe(true);
    expect(hasB).toBe(true);
  });
});
```

### Test Pattern: Reducer with N < 30 questions

```typescript
describe('gameReducer: variable round count (uses state.questions.length, not TOTAL_ROUNDS)', () => {
  it('advances + finishes a 5-question game correctly', () => {
    const qs = makeQuestions(5);
    let state = gameReducer(initialGameState, { type: 'START_GAME', payload: { questions: qs } });

    // Walk through 4 rounds: answer + advance.
    for (let r = 0; r < 4; r++) {
      state = gameReducer(state, { type: 'ANSWER_QUESTION', payload: { isCorrect: true } });
      state = gameReducer(state, { type: 'ADVANCE_TO_NEXT' });
    }
    // Now on round 5 (roundIndex=4, last round); answer it.
    expect(state.roundIndex).toBe(4);
    state = gameReducer(state, { type: 'ANSWER_QUESTION', payload: { isCorrect: true } });

    // ADVANCE_TO_NEXT on last round should be a no-op (game uses state.questions.length, not TOTAL_ROUNDS).
    const noOp = gameReducer(state, { type: 'ADVANCE_TO_NEXT' });
    expect(noOp).toBe(state); // returns same state reference

    // FINISH_GAME should work and transition to 'end'.
    state = gameReducer(state, { type: 'FINISH_GAME' });
    expect(state.phase).toBe('end');
  });
});
```

### Common LLM Mistakes to Avoid

- **Do NOT** add a `type` field to `MultipleChoiceQuestionSchema` / `SpeedOrderQuestionSchema` / `SpeedSelectQuestionSchema` — that would require changing the JSON content files. The discriminator lives on the **wrapper** schema (`GameQuestionSchema`), not the inner pool schemas.
- **Do NOT** change the JSON content files. They stay as flat single-type pools.
- **Do NOT** delete `selectEpic1Game` from `gameSetup.ts` — Story 2.8 retires it. Until then, App.tsx still calls it.
- **Do NOT** change `App.tsx` in this story — Story 2.8 does the swap. Speed components don't exist yet; switching now would render the "Speed round coming soon" placeholder for rounds 16-30 in production.
- **Do NOT** add answer-payload-shape logic to the reducer — components own correctness computation. See "Why the Reducer Doesn't Need..." above.
- **Do NOT** rely on `TOTAL_ROUNDS` for game-length logic — use `state.questions.length`. The constant stays for documentation, not enforcement.
- **Do NOT** forget to update the GameScreen test's `setupGameScreen` if it imports `GameQuestion` from `gameReducer.ts` — the type is now from the schema. (Path forward: re-export `GameQuestion` from `gameReducer.ts` for backward compat OR update the import path everywhere. Re-exporting is less churn.)

### Re-exporting `GameQuestion` from `gameReducer.ts` (optional but lower-churn)

If many existing files import `GameQuestion` from `gameReducer.ts`, you can avoid touching them by adding a re-export:

```typescript
// In src/lib/gameReducer.ts, after the imports:
export type { GameQuestion } from './schemas/question.schema';
```

This way `import type { GameQuestion } from '../../lib/gameReducer'` still works for any consumers that haven't been updated. Recommended unless there are very few callsites.

### Previous Story Intelligence

**From Story 1.6 (questionSelection.ts):**
- `pickRandomFromPool<T>(pool, count, rng)` does Fisher-Yates and returns `count` items
- Calling with `count === pool.length` produces a shuffled copy of the whole pool — useful for in-place shuffling

**From Story 1.8 (gameReducer + GameQuestion type):**
- `GameQuestion` originally defined as a TS discriminated union in gameReducer.ts
- This story moves the source of truth to the schema file (single-source-of-truth principle from other types like `MultipleChoiceQuestion`)

**From Story 1.17 (selectEpic1Game + App composition):**
- App.tsx uses `selectEpic1Game(mcPool, defaultRng)` for both `startGame` and `playAgain`
- `selectEpic1Game` is the Epic 1 placeholder; Story 2.8 swaps to `selectGameQuestions` once speed components ship

**From the recent MC-shuffle fix (0bf5f3a):**
- `shuffleMCQuestion(question, rng)` shuffles options + remaps correctIndex/funnyWrongIndex
- This function is needed both by `selectEpic1Game` (already) and `selectGameQuestions` (new). Moving it to `questionSelection.ts` puts it next to its new consumer.

### Git Intelligence

Last 4 commits on main:

```
b1359b0 Add Story 2.2 dev spec to planning artifacts
9726cbe Story 2.2: Author 40 Speed Type B (multi-select) questions
e386eab Fix FeedbackOverlay: fade-in animation + remove delayed NEXT button
9592cff Fix MC reveal: asymmetric duration — wrong answers get 3000ms
```

Story 2.3 builds on `b1359b0`.

### Latest Tech Information

- **Zod `z.discriminatedUnion(key, options[])`** — requires each option to be `z.object({...})` with the discriminator key as a `z.literal(...)`. The pattern in this story matches that exactly.
- No new dependencies.

### Project Structure Notes

**Alignment with architecture:**
- `src/lib/schemas/question.schema.ts` extended ✓
- `src/lib/questionSelection.ts` extended ✓
- `src/lib/gameReducer.ts` updated ✓
- Discriminated-union pattern preserved (architecture lines 269-286, "State & Reducer Patterns")
- `z.infer<>` single-source-of-truth pattern preserved (architecture line 299)

### References

- **Story source:** `_bmad-output/planning-artifacts/epics.md` § "Epic 2, Story 2.3"
- **PRD FRs:** FR2 (rounds 1-15 MC, 16-30 speed), FR3 (speed 50/50 ±1), FR9.1 (MC options randomized per game)
- **Architecture:** §"State & Reducer Patterns" (lines 269-286), §"Content Loading Pattern" (lines 288-299)
- **Latent bug ref:** Story 1.17 deploy commit `936a98b` — reducer's TOTAL_ROUNDS hardcode introduced when Epic 1 milestone reduced game length to 15

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code)

### Debug Log References

None — clean implementation. Re-export of `GameQuestion` from `gameReducer.ts` kept the 4 existing import sites working without churn.

### Completion Notes List

- **`schemas/question.schema.ts`** — added `GameQuestionSchema` (Zod discriminated union over wrapper objects with `type: 'mc' | 'order' | 'select'`) + exported `type GameQuestion = z.infer<...>`. Pool schemas unchanged.
- **`gameReducer.ts`** — removed local `GameQuestion` type, imported from schema + re-exported for back-compat with 4 existing call sites (useGameState, gameSetup, GameProvider.test, GameScreen.test). Fixed latent Story 1.17 bug: `ADVANCE_TO_NEXT` and `FINISH_GAME` now check `state.questions.length - 1` instead of `TOTAL_ROUNDS - 1`. `TOTAL_ROUNDS = 30` kept as a documentary export.
- **`questionSelection.ts`** — `shuffleMCQuestion` moved here from gameSetup.ts (re-exported there for back-compat). Added `selectGameQuestions(allMC, allOrder, allSelect, rng)` returning 30 GameQuestions per FR2/FR3 (15 MC + 7-or-8 of each speed type).
- **`gameSetup.ts`** — `selectEpic1Game` unchanged; `shuffleMCQuestion` now imported + re-exported from questionSelection.ts.
- **App.tsx unchanged** — production still on `selectEpic1Game`. Story 2.8 will swap to `selectGameQuestions` once speed components ship.
- **Test count: 207** (was 199 → +8 net):
  - +5 `shuffleMCQuestion` tests moved into questionSelection.test.ts
  - +7 new `selectGameQuestions` tests (length, type ordering, 50/50 split, determinism, mixed types, deterministic 7/8 split based on rng)
  - +2 new reducer tests for variable round count (5-question game completes; FINISH_GAME no-op mid-game)
  - -6 removed `shuffleMCQuestion` tests from gameSetup.test.ts (relocated)
- **Bundle: 468.50 / 138.90 kB** (was 465.58 / 138.14 — +2.9 kB raw / +0.7 kB gzip). The growth is Zod's discriminatedUnion runtime + the selectGameQuestions function code.

### File List

- **MODIFIED** `src/lib/schemas/question.schema.ts` (added GameQuestionSchema + type)
- **MODIFIED** `src/lib/gameReducer.ts` (use state.questions.length instead of TOTAL_ROUNDS; import + re-export GameQuestion from schema)
- **MODIFIED** `src/lib/questionSelection.ts` (added shuffleMCQuestion + selectGameQuestions)
- **MODIFIED** `src/lib/questionSelection.test.ts` (added tests for shuffleMCQuestion + selectGameQuestions)
- **MODIFIED** `src/lib/gameSetup.ts` (import + re-export shuffleMCQuestion from questionSelection)
- **MODIFIED** `src/lib/gameSetup.test.ts` (removed relocated tests)
- **MODIFIED** `src/lib/gameReducer.test.ts` (added 2 variable-round-count tests)

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-24 | Story created. Adds GameQuestionSchema (Zod discriminated union), selectGameQuestions (30-round selector with FR2/FR3 split), and fixes latent Story 1.17 bug where reducer's TOTAL_ROUNDS hardcode would prevent FINISH_GAME from firing on Epic 1's 15-question games. App.tsx unchanged — Story 2.8 does the swap. | bmad-create-story (Claude Opus 4.7) |
| 2026-05-24 | Story implemented and shipped. 207 tests pass (199 prior + 8 net new). Bundle +0.7 kB gzip. Re-exports preserved 4 existing GameQuestion import sites without code churn. | bmad-dev-story (Claude Opus 4.7) |
