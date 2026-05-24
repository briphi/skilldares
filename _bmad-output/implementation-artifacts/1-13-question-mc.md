# Story 1.13: Multiple-Choice Question Component

Status: review

## Story

As a player,
I want a clear 4-quadrant MC question I can answer with a single tap,
so that the answer mechanic feels obvious from round 1.

## Acceptance Criteria

1. **`src/components/game/QuestionMC.tsx` exists with this contract:**
   - Props: `{ question: MultipleChoiceQuestion; usedHint: boolean; onAnswer: (isCorrect: boolean) => void; rng?: Rng }`
   - `question` is the Zod-validated type from Story 1.3 (`prompt`, `options` length 4, `correctIndex`, `funnyWrongIndex`, `menuRefs`)
   - Decoupled from reducer: parent reads `state.usedHintThisQuestion` and the current question from `useGameState`, and wires `onAnswer` to `helpers.answerQuestion(isCorrect)`
   - `rng` defaults to `defaultRng`; tests pass a deterministic rng

2. **Layout: 2×2 grid of color-block answer quadrants per UX:**
   - Question prompt rendered above the grid (display font, large)
   - Grid: `display: grid; grid-template-columns: 1fr 1fr;` with a small gap
   - Each quadrant is a semantic `<button>`, `min-height: 120px`, full-quadrant tappable
   - Quadrants use `--color-answer-1` through `--color-answer-4` (blue, pink, amber, emerald) in order
   - Text on quadrants uses `--color-text-inverse` (dark text on bright background) for legibility
   - Per-component CSS Module; all values via design tokens (no hardcoded colors/sizes)

3. **Lock-on-tap (FR11):**
   - Component tracks internal `selectedIndex: number | null` via `useState`
   - First tap sets `selectedIndex` and calls `onAnswer(index === question.correctIndex)`
   - Subsequent taps are ignored — quadrant is locked
   - Component resetting between rounds is the **parent's** responsibility via `key={roundIndex}` on `<QuestionMC>` (parent remounts the component on round change)

4. **Post-answer reveal states (after `selectedIndex` is set):**
   - The correct quadrant displays a `✓` overlay (regardless of which the player picked)
   - If the player picked wrong, the picked quadrant displays a `✗` overlay
   - The non-correct, non-picked quadrants are visually muted (lowered opacity)
   - The grid as a whole is no longer tappable (every quadrant has `disabled`)

5. **Hint greying (FR27):**
   - When `usedHint` is `true`, exactly ONE of the three wrong quadrants is randomly chosen and rendered as greyed-out + non-tappable
   - The chosen wrong-index is **stable per question** — does NOT re-pick on each render
   - Uses the injected `rng` once per (question, usedHint=true) transition via `useMemo`
   - The "obviously wrong / funny" option (`question.funnyWrongIndex`) is excluded from being greyed out, **so the hint doesn't preserve the funny option as a too-easy clue** — instead, prefer to grey out one of the two close-distractor wrong options
     - Wrong indices = `[0,1,2,3].filter(i => i !== correctIndex)` → 3 entries
     - Removable indices = `wrongIndices.filter(i => i !== funnyWrongIndex)` → exactly 2 entries (the two close distractors)
     - Greyed index = uniform-random pick from those 2 distractors

6. **Accessibility:**
   - Each quadrant is a real `<button>` (keyboard focusable, Enter/Space activates)
   - Quadrant text is announced; ✓/✗ overlays use `aria-hidden="true"` (the verdict is announced by the FeedbackOverlay in Story 1.14, not redundantly here)
   - Disabled quadrants set the native `disabled` attribute
   - Prompt is an `<h2>` (the GameScreen header in Story 1.15+ owns the `<h1>` — score / progress)

7. **`QuestionMC.test.tsx` covers:**
   - Renders prompt + all 4 option labels as buttons
   - Tapping the correct quadrant calls `onAnswer(true)` exactly once
   - Tapping a wrong quadrant calls `onAnswer(false)` exactly once
   - Second tap is ignored (no extra `onAnswer` call)
   - Post-answer: correct quadrant has a `✓`, wrong-picked quadrant has a `✗`, other quadrants are muted (have a "muted" class marker or `aria-hidden` overlay — pick one indicator and assert it)
   - With `usedHint=true` + a deterministic rng, one specific wrong quadrant (a close distractor, never the funny-wrong) is greyed/disabled
   - The greyed quadrant does NOT call `onAnswer` when tapped

8. **Build + tests pass:**
   - `npm test` exit 0 (134 prior + 7+ new)
   - `npm run build` clean
   - Bundle unchanged (component not yet imported by App.tsx; tree-shaken)

## Tasks / Subtasks

- [x] **Task 1: Pre-work safety check**
  - [x] Working tree clean; on `main`; up to date
  - [x] Verify Story 1.12 in place: `src/components/game/HintButton.tsx`; 134 tests pass
  - [x] Create branch `story/1-13-question-mc`

- [x] **Task 2: Implement `src/components/game/QuestionMC.tsx`**
  - [x] File per Dev Notes
  - [x] Type-check clean: `npx tsc --noEmit`

- [x] **Task 3: Implement `src/components/game/QuestionMC.module.css`**
  - [x] 2×2 grid layout, 4 quadrant color variants, hint-greyed + muted + reveal states
  - [x] All values via `var(--token)`

- [x] **Task 4: Implement `src/components/game/QuestionMC.test.tsx`**
  - [x] 7+ tests per AC #7
  - [x] Tests pass: `npx vitest run src/components/game/QuestionMC.test.tsx`

- [x] **Task 5: Full test + build verification**
  - [x] `npm test` all green
  - [x] `npm run build` clean

- [x] **Task 6: Commit + push to main**
  - [x] Two commits (src + spec) per established pattern
  - [x] Fast-forward `main`, push, delete branch

## Dev Notes

### Why a Reveal State Lives In QuestionMC, Not in the Parent

The post-answer reveal (✓ on correct, ✗ on wrong-pick, muted on others) is intrinsic to the question component's rendering — it's the same physical buttons changing visual state, not new elements appearing. Keeping the reveal **inside** QuestionMC means:
- One mental model per cell: "render with current selectedIndex; if null, show default; if set, show reveal."
- The FeedbackOverlay (Story 1.14) handles the *separate* big-verdict treatment (overlay above the question)
- The parent doesn't need to thread reveal flags through — it just sets a new `key` between rounds to fully reset.

### Why Hint Excludes the Funny-Wrong Option

The PRD's FR9 structure: each MC question has 1 correct, 1 funny-wrong (e.g., "Rat Feces" in an ingredient list), and 2 close-distractors. If the hint greys out a *random* wrong answer, ~33% of the time it removes the funny option — but the funny option is already obvious; removing it doesn't actually help the player. To make the hint a *real* assist, we always grey out one of the two close-distractor wrong options (the ones the player would actually consider). This decision isn't in the epic ACs verbatim but follows directly from FR27 ("the hint must aid the player") + FR9 (the structural definition of the 4 options).

If this interpretation is wrong, the spec falls back to: grey out any wrong option uniform-random (simpler). I think the distractor-only behavior is closer to the spec's intent. Document the choice clearly.

### Exact `src/components/game/QuestionMC.tsx`

```typescript
import { useMemo, useState } from 'react';
import type { MultipleChoiceQuestion } from '../../lib/schemas/question.schema';
import { defaultRng, type Rng } from '../../lib/rng';
import styles from './QuestionMC.module.css';

export type QuestionMCProps = {
  question: MultipleChoiceQuestion;
  usedHint: boolean;
  onAnswer: (isCorrect: boolean) => void;
  /** Override randomness — used by tests. Defaults to Math.random(). */
  rng?: Rng;
};

function pickHintGreyedIndex(question: MultipleChoiceQuestion, rng: Rng): number {
  // Wrong options excluding the obviously-funny one — so the hint greys out
  // a real distractor, not "Rat Feces".
  const distractors = [0, 1, 2, 3].filter(
    (i) => i !== question.correctIndex && i !== question.funnyWrongIndex,
  );
  if (distractors.length === 0) {
    // Defensive: schema guarantees funnyWrongIndex !== correctIndex, so
    // distractors.length is always 2. This branch is here as a typesafe fallback.
    const wrongs = [0, 1, 2, 3].filter((i) => i !== question.correctIndex);
    return wrongs[Math.floor(rng() * wrongs.length)]!;
  }
  return distractors[Math.floor(rng() * distractors.length)]!;
}

type QuadrantState = 'default' | 'greyed' | 'correct' | 'wrongSelected' | 'muted';

function quadrantStateFor(
  index: number,
  question: MultipleChoiceQuestion,
  selectedIndex: number | null,
  greyedIndex: number | null,
): QuadrantState {
  if (selectedIndex === null) {
    return greyedIndex === index ? 'greyed' : 'default';
  }
  // Post-answer reveal
  if (index === question.correctIndex) return 'correct';
  if (index === selectedIndex) return 'wrongSelected';
  return 'muted';
}

export function QuestionMC({ question, usedHint, onAnswer, rng = defaultRng }: QuestionMCProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Stable hint-greyed index per (question, usedHint=true) transition.
  // rng intentionally NOT in deps — re-renders shouldn't re-pick.
  const greyedIndex = useMemo<number | null>(() => {
    if (!usedHint) return null;
    return pickHintGreyedIndex(question, rng);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usedHint, question]);

  const handleTap = (index: number) => {
    if (selectedIndex !== null) return; // locked
    if (index === greyedIndex) return; // hint-greyed
    setSelectedIndex(index);
    onAnswer(index === question.correctIndex);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.prompt}>{question.prompt}</h2>
      <div className={styles.grid} role="group" aria-label="Answer options">
        {question.options.map((option, index) => {
          const state = quadrantStateFor(index, question, selectedIndex, greyedIndex);
          const isDisabled = state === 'greyed' || selectedIndex !== null;
          const classes = [
            styles.quadrant,
            styles[`color${index + 1}` as 'color1' | 'color2' | 'color3' | 'color4'],
            styles[state],
          ].join(' ');

          return (
            <button
              key={index}
              type="button"
              className={classes}
              onClick={() => handleTap(index)}
              disabled={isDisabled}
              data-quadrant-index={index}
              data-quadrant-state={state}
            >
              <span className={styles.optionText}>{option}</span>
              {state === 'correct' && (
                <span className={styles.overlay} aria-hidden="true">✓</span>
              )}
              {state === 'wrongSelected' && (
                <span className={styles.overlay} aria-hidden="true">✗</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

### Exact `src/components/game/QuestionMC.module.css`

```css
.container {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
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

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: var(--space-3);
  width: 100%;
}

.quadrant {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  padding: var(--space-4);
  border: none;
  border-radius: var(--radius-lg);
  font-family: var(--font-ui);
  font-size: var(--text-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-inverse);
  cursor: pointer;
  transition:
    transform var(--motion-fast) var(--ease-snappy),
    opacity var(--motion-base) var(--ease-snappy);
  text-align: center;
  overflow: hidden;
}

.quadrant:active:not(:disabled) {
  transform: scale(0.98);
}

.quadrant:disabled {
  cursor: default;
}

/* Color variants */
.color1 { background-color: var(--color-answer-1); }
.color2 { background-color: var(--color-answer-2); }
.color3 { background-color: var(--color-answer-3); }
.color4 { background-color: var(--color-answer-4); }

/* States */
.default {
  /* no-op; default styling */
}

.greyed {
  background-color: var(--color-bg-accent);
  color: var(--color-text-muted);
  opacity: 0.5;
}

.correct {
  /* keep the color, add subtle outline */
  outline: 3px solid var(--color-state-success);
  outline-offset: -3px;
}

.wrongSelected {
  outline: 3px solid var(--color-state-error);
  outline-offset: -3px;
}

.muted {
  opacity: 0.35;
}

.optionText {
  position: relative;
  z-index: 1;
}

.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-3xl);
  font-weight: var(--font-weight-black);
  color: var(--color-text-inverse);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  pointer-events: none;
}
```

### Exact `src/components/game/QuestionMC.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionMC } from './QuestionMC';
import type { MultipleChoiceQuestion } from '../../lib/schemas/question.schema';

const fixtureQuestion: MultipleChoiceQuestion = {
  prompt: 'Which IS a Kildares Wing flavor?',
  options: ['Whiskey BBQ', 'Garlic Parm', 'Soap-Glazed Sadness', 'Buffalo'],
  correctIndex: 0,         // Whiskey BBQ
  funnyWrongIndex: 2,      // Soap-Glazed Sadness
  menuRefs: [],
};

describe('QuestionMC', () => {
  describe('default render', () => {
    it('renders the prompt', () => {
      render(<QuestionMC question={fixtureQuestion} usedHint={false} onAnswer={() => {}} />);
      expect(screen.getByText(fixtureQuestion.prompt)).toBeTruthy();
    });

    it('renders all 4 options as buttons', () => {
      render(<QuestionMC question={fixtureQuestion} usedHint={false} onAnswer={() => {}} />);
      for (const option of fixtureQuestion.options) {
        expect(screen.getByRole('button', { name: option })).toBeTruthy();
      }
    });

    it('starts with no quadrants disabled', () => {
      render(<QuestionMC question={fixtureQuestion} usedHint={false} onAnswer={() => {}} />);
      for (const option of fixtureQuestion.options) {
        const btn = screen.getByRole('button', { name: option });
        expect((btn as HTMLButtonElement).disabled).toBe(false);
      }
    });
  });

  describe('lock-on-tap', () => {
    it('calls onAnswer(true) when the correct quadrant is tapped', async () => {
      const onAnswer = vi.fn();
      render(<QuestionMC question={fixtureQuestion} usedHint={false} onAnswer={onAnswer} />);
      await userEvent.click(screen.getByRole('button', { name: 'Whiskey BBQ' }));
      expect(onAnswer).toHaveBeenCalledTimes(1);
      expect(onAnswer).toHaveBeenCalledWith(true);
    });

    it('calls onAnswer(false) when a wrong quadrant is tapped', async () => {
      const onAnswer = vi.fn();
      render(<QuestionMC question={fixtureQuestion} usedHint={false} onAnswer={onAnswer} />);
      await userEvent.click(screen.getByRole('button', { name: 'Buffalo' }));
      expect(onAnswer).toHaveBeenCalledTimes(1);
      expect(onAnswer).toHaveBeenCalledWith(false);
    });

    it('ignores subsequent taps after the first', async () => {
      const onAnswer = vi.fn();
      render(<QuestionMC question={fixtureQuestion} usedHint={false} onAnswer={onAnswer} />);
      await userEvent.click(screen.getByRole('button', { name: 'Whiskey BBQ' }));
      // userEvent.click on a disabled button is a no-op; we explicitly check.
      await userEvent.click(screen.getByRole('button', { name: 'Buffalo' }));
      expect(onAnswer).toHaveBeenCalledTimes(1);
    });
  });

  describe('post-answer reveal', () => {
    it('marks the correct quadrant with state=correct after a wrong tap', async () => {
      const { container } = render(
        <QuestionMC question={fixtureQuestion} usedHint={false} onAnswer={() => {}} />,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Buffalo' }));

      const correctBtn = container.querySelector('[data-quadrant-index="0"]') as HTMLButtonElement;
      const pickedBtn = container.querySelector('[data-quadrant-index="3"]') as HTMLButtonElement;
      const mutedBtn = container.querySelector('[data-quadrant-index="1"]') as HTMLButtonElement;

      expect(correctBtn.getAttribute('data-quadrant-state')).toBe('correct');
      expect(pickedBtn.getAttribute('data-quadrant-state')).toBe('wrongSelected');
      expect(mutedBtn.getAttribute('data-quadrant-state')).toBe('muted');
    });

    it('marks only the correct quadrant with state=correct after a correct tap', async () => {
      const { container } = render(
        <QuestionMC question={fixtureQuestion} usedHint={false} onAnswer={() => {}} />,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Whiskey BBQ' }));

      expect(
        container.querySelector('[data-quadrant-index="0"]')!.getAttribute('data-quadrant-state'),
      ).toBe('correct');
      // The two non-picked, non-correct quadrants are muted.
      for (const idx of [1, 2, 3]) {
        expect(
          container.querySelector(`[data-quadrant-index="${idx}"]`)!.getAttribute('data-quadrant-state'),
        ).toBe('muted');
      }
    });

    it('disables all quadrants after the first tap', async () => {
      render(<QuestionMC question={fixtureQuestion} usedHint={false} onAnswer={() => {}} />);
      await userEvent.click(screen.getByRole('button', { name: 'Whiskey BBQ' }));
      for (const option of fixtureQuestion.options) {
        expect((screen.getByRole('button', { name: option }) as HTMLButtonElement).disabled).toBe(true);
      }
    });
  });

  describe('hint greying', () => {
    it('greys out exactly one wrong distractor when usedHint is true', () => {
      const { container } = render(
        <QuestionMC
          question={fixtureQuestion}
          usedHint
          onAnswer={() => {}}
          rng={() => 0}  // first item in the 2-distractor list
        />,
      );
      // distractors = [1, 3] (index 0 is correct, index 2 is funny-wrong)
      // rng=0 → distractors[0] = index 1 (Garlic Parm)
      const greyedBtn = container.querySelector('[data-quadrant-state="greyed"]');
      expect(greyedBtn).toBeTruthy();
      expect(greyedBtn?.getAttribute('data-quadrant-index')).toBe('1');
      expect((greyedBtn as HTMLButtonElement).disabled).toBe(true);
    });

    it('never greys out the funny-wrong option', () => {
      // Even with rng that would pick "the third wrong index", the distractors
      // list only contains the two non-funny wrongs.
      const { container } = render(
        <QuestionMC
          question={fixtureQuestion}
          usedHint
          onAnswer={() => {}}
          rng={() => 0.99}  // last item in the 2-distractor list
        />,
      );
      // distractors = [1, 3]; rng=0.99 → Math.floor(0.99 * 2) = 1 → index 3
      const greyedBtn = container.querySelector('[data-quadrant-state="greyed"]');
      expect(greyedBtn?.getAttribute('data-quadrant-index')).toBe('3');
      // Funny-wrong (index 2) is NOT greyed.
      const funnyBtn = container.querySelector('[data-quadrant-index="2"]');
      expect(funnyBtn?.getAttribute('data-quadrant-state')).toBe('default');
    });

    it('tapping the greyed quadrant does NOT call onAnswer', async () => {
      const onAnswer = vi.fn();
      render(
        <QuestionMC
          question={fixtureQuestion}
          usedHint
          onAnswer={onAnswer}
          rng={() => 0}
        />,
      );
      // Garlic Parm (index 1) is the greyed quadrant; clicking a disabled
      // button is suppressed by the browser.
      await userEvent.click(screen.getByRole('button', { name: 'Garlic Parm' }));
      expect(onAnswer).not.toHaveBeenCalled();
    });
  });
});
```

### Common LLM Mistakes to Avoid

- **Do NOT** import the JSON content in tests — use inline fixtures (`fixtureQuestion`)
- **Do NOT** put `rng` in the `useMemo` deps array — re-renders shouldn't re-pick the hint-greyed index
- **Do NOT** reset `selectedIndex` via `useEffect` on question change — let the parent control mount lifetime via `key={roundIndex}`
- **Do NOT** dispatch directly from QuestionMC — it's decoupled; uses `onAnswer` callback
- **Do NOT** hardcode answer colors (`#3b82f6`, etc.) — use `--color-answer-1` through `--color-answer-4`
- **Do NOT** add ARIA roles/text for the ✓ / ✗ overlays — they're decorative (`aria-hidden="true"`); the FeedbackOverlay (Story 1.14) handles the announced verdict
- **Do NOT** include a "Submit" button — MC is lock-on-tap per FR11
- **Do NOT** show the correct answer if the player picked it — the `correct` state on that quadrant is reward visual + ✓; no extra "you got it" text in this component (FeedbackOverlay handles voice)
- **Do NOT** let the funny-wrong option be the greyed-out one (see distractor explanation above)
- **Do NOT** use `useEffect` for the hint logic — `useMemo` is sufficient and synchronous, no risk of double-pick

### Testing Standards

- Vitest + jsdom (configured)
- `render` + `screen` + `userEvent` from RTL
- Query by role + accessible name (the button's text is its accessible name)
- For state checks, use `data-quadrant-state` (semantic, not CSS-class-coupled)
- `userEvent.click` on a disabled button is a documented no-op — we still assert the count

### Previous Story Intelligence

**From Story 1.3 (schemas):**
- `MultipleChoiceQuestion` has 4 options, `correctIndex`, `funnyWrongIndex` (refined to differ from `correctIndex`)
- Use `import type { MultipleChoiceQuestion } from '../../lib/schemas/question.schema'`

**From Story 1.6 (Rng):**
- `defaultRng` is `Math.random`; injected for testability
- `pickMessage` / `pickRandomFromPool` patterns established — `Math.floor(rng() * arr.length)`

**From Story 1.8 (reducer):**
- `ANSWER_QUESTION` action payload: `{ isCorrect: boolean }` — that's what `onAnswer` projects into
- `usedHint` lives in `state.usedHintThisQuestion`

**From Stories 1.10–1.12 (component patterns):**
- All UI components decoupled from reducer via callback props
- CSS Modules with design tokens; `data-*` attributes for test stability without coupling tests to CSS class names

### Git Intelligence

Last 4 commits on main:

```
68f22e4 Add Story 1.12 dev spec to planning artifacts
6d4373a Story 1.12: HintButton — thin secondary-pill wrapper
06a411a Add Story 1.11 dev spec to planning artifacts
9320fcb Story 1.11: ScoreDisplay — count-up animation via Motion animate()
```

Story 1.13 builds on `68f22e4`.

### Latest Tech Information

No new dependencies. Reuses React, CSS Modules, Vitest + RTL + user-event.

### Project Structure Notes

**Alignment with architecture:**
- `src/components/game/QuestionMC.tsx` + `.module.css` + `.test.tsx` ✓
- Decoupled from reducer — same pattern as StartScreen/ScoreDisplay/HintButton
- Schema type imported from `src/lib/schemas/question.schema` ✓ (no parallel hand-written type)

### References

- **Story source:** `_bmad-output/planning-artifacts/epics.md` § "Epic 1, Story 1.13"
- **PRD FRs:** FR8 (prompt + 4 options), FR9 (4-option structure: 1 correct, 1 funny-wrong, 2 distractors), FR10 (question shapes), FR11 (lock-on-tap), FR27 (hint greys one wrong)
- **Architecture:** §"Requirements → File Mapping" (F2 → QuestionMC), §"Frontend Architecture" (React Context, CSS Modules)
- **UX:** §"Color System" — answer block palette, §"QuestionMC" component spec (line 503), §"Touch Target Patterns" — MC quadrants ≥120pt
- **Previous stories:** 1-3 (schema), 1-6 (Rng), 1-8 (reducer), 1-9 (Button + tokens), 1-12 (HintButton)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code)

### Debug Log References

None — 12/12 tests passed on first run.

### Completion Notes List

- `src/components/game/QuestionMC.tsx`: 4-quadrant grid; lock-on-tap via `selectedIndex` state; `quadrantStateFor` helper computes per-cell state (default/greyed/correct/wrongSelected/muted) from `(selectedIndex, greyedIndex, correctIndex)`.
- Hint greying via `useMemo([usedHint, question])` — rng intentionally excluded from deps so re-renders don't re-pick. Distractor-only selection (skips funnyWrongIndex) means the hint always removes a real plausible-wrong, never the obviously-funny option.
- Reveal overlays (✓ / ✗) are `aria-hidden="true"` decorative spans — the FeedbackOverlay (Story 1.14) handles the announced verdict.
- `data-quadrant-state` + `data-quadrant-index` attributes give tests stable selectors without coupling to CSS class names.
- Component decoupled from reducer: `onAnswer(isCorrect)` callback prop. Parent uses `<QuestionMC key={roundIndex} ... />` to reset state between rounds.
- 12 tests pass across 4 describe blocks: default render (3), lock-on-tap (3), post-answer reveal (3), hint greying (3).
- **Test count: 146** (was 134 → +12).
- **Bundle: 194.36 kB / gzip 61.24 kB — unchanged.** QuestionMC tree-shaken until GameScreen (Story 1.15) imports it.

### File List

- **NEW** `src/components/game/QuestionMC.tsx`
- **NEW** `src/components/game/QuestionMC.module.css`
- **NEW** `src/components/game/QuestionMC.test.tsx`

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-23 | Story created. 4-quadrant MC with lock-on-tap, post-answer reveal states (correct/wrong-selected/muted), and hint greying that intentionally avoids the funny-wrong option so the hint removes a real distractor. Decoupled from reducer via onAnswer callback; parent controls reset via key={roundIndex}. | bmad-create-story (Claude Opus 4.7) |
| 2026-05-23 | Story implemented and shipped. 146 tests pass (134 prior + 12 new). All ACs satisfied on first run. Bundle unchanged — tree-shaken until Story 1.15's GameScreen imports it. | bmad-dev-story (Claude Opus 4.7) |
