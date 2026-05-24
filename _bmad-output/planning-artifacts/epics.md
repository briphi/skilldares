---
stepsCompleted: [1, 2, 3, 4]
status: 'complete'
completedAt: '2026-05-23'
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-skilldares-2026-05-23/prd.md
  - _bmad-output/planning-artifacts/prds/prd-skilldares-2026-05-23/.decision-log.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/planning-artifacts/briefs/brief-skilldares-2026-05-23/brief.md
  - _bmad-output/planning-artifacts/briefs/brief-skilldares-2026-05-23/.decision-log.md
---

# Skilldares - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for **Skilldares**, decomposing the requirements from the PRD, UX Design Specification, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

**F1 — Game Loop & State Management**

- FR1: The app SHALL present exactly 30 rounds per game.
- FR2: Rounds 1–15 SHALL be multiple-choice; rounds 16–30 SHALL be speed-based.
- FR3: Within the 15 speed rounds, the app SHALL split question types approximately 50/50 between Type A (drag-order) and Type B (multi-select), tolerating ±1 per game.
- FR4: The app SHALL maintain in-memory game state: current round (1–30), score, signed streak, hint-used flag.
- FR5: Game state SHALL NOT persist across browser sessions or refreshes; a mid-game refresh discards progress and returns to the Start screen.
- FR6: Question selection per game SHALL be uniform-random from the available pools, subject to FR2 and FR3.
- FR7: A running score SHALL be displayed in the upper-right of the gameplay UI at all times during play.

**F2 — Multiple-Choice Round (Rounds 1–15)**

- FR8: Each MC question SHALL present a question prompt and exactly four answer options.
- FR9: Of the four options, exactly one SHALL be correct, exactly one SHALL be obviously-wrong-and-funny, and exactly two SHALL be close-distractors.
- FR10: Question shapes SHALL include at minimum: ingredient listing, pricing, attribute/category (e.g., GF).
- FR11: Selecting an option SHALL immediately lock the answer (no change after selection) and trigger the feedback flow.

**F3 — Speed Round Type A — Drag-to-Order**

- FR12: Each Type A question SHALL present 3–5 squares of menu items with a prompt to arrange them by a specified factor.
- FR13: Permitted factors are limited to: price, ABV (drinks only where ABV is listed).
- FR14: The user SHALL be able to drag and rearrange squares; the interaction SHALL work on both touch and mouse input devices.
- FR15: A 15-second countdown timer SHALL be visible while the question is active.
- FR16: A Submit button SHALL be visible; the user submits when ready.
- FR17: If the timer reaches zero before submission, the question is scored as wrong.
- FR18: On submission, each square SHALL reveal the factor value beneath it, with overall correct/wrong marking.

**F4 — Speed Round Type B — Multi-Select Criteria**

- FR19: Each Type B question SHALL present 5 squares of menu items with a prompt to select all matching a criteria.
- FR20: Permitted criteria types: (a) items in [dish]; (b) items that are GF; (c) items in [menu section].
- FR21: The correct subset SHALL contain at least one item and MAY contain up to all five; non-correct squares SHALL be real menu items chosen as close-distractors.
- FR22: The user SHALL be able to select and deselect squares individually before submission.
- FR23: A Submit button SHALL be visible; a 15-second timer applies per FR15/FR17.
- FR24: On submission, the app SHALL reveal which selections were correct vs wrong; scored correct only on exact match (all-or-nothing).

**F5 — Hint Mechanic (MC Rounds Only)**

- FR25: A Hint button SHALL be visible on each MC question (rounds 1–15).
- FR26: The Hint button SHALL NOT be visible on speed rounds.
- FR27: Tapping Hint SHALL grey out one randomly-selected wrong answer, leaving 3 active options.
- FR28: Hint SHALL be available once per question (independent across questions).
- FR29: Using the hint SHALL alter scoring for that question (see F6).

**F6 — Scoring**

- FR30: Correct answer (no hint used) SHALL award 5 points.
- FR31: Correct answer (hint used) SHALL award 2 points.
- FR32: Wrong answer SHALL award 0 points; no negative scoring.
- FR33: Timer expiry on a speed round SHALL be treated as wrong (0 points).
- FR34: Speed Type A and Type B SHALL both be scored all-or-nothing (5 for exact match, 0 otherwise); hint mechanic does not apply.
- FR35: When points are awarded, the score display SHALL animate as a count-up from previous to new value, with bounce.

**F7 — Personality / Feedback Message System**

- FR36: After every answered (or timed-out) question, the app SHALL display correct/incorrect feedback + a single personality message from a pool selected by the picker.
- FR37: The app SHALL maintain 8 pre-authored message pools: `pre-game-encouragement` (50), `right-no-streak` (50), `wrong-no-streak` (50), `on-fire` (50), `doing-bad` (50), `streak-broken` (50), `comeback` (50), `new-high-score` (~20). Total: 370 messages.
- FR38: Per-answer picker logic — on correct: if prev streak ≤−3 → `comeback`, else if new streak ≥3 → `on-fire`, else → `right-no-streak`. On wrong: if prev streak ≥3 → `streak-broken`, else if new streak ≤−3 → `doing-bad`, else → `wrong-no-streak`.
- FR39: Within a chosen pool, message SHALL be selected uniform-random; MAY avoid most-recent-shown within a single game.
- FR40: Streak state SHALL reset to 0 at the start of every game (including Play Again).
- FR41: Message voice SHALL be irreverent, willing to be harsh/profane, willing to praise hard; voice consistency across pools is a content requirement.

**F8 — Start Screen**

- FR42: The Start screen SHALL display the app title, a Start Game button, and one random message from `pre-game-encouragement`.
- FR43: No instructional text or rules summary SHALL be shown; mechanics are discoverable through play.
- FR44: Tapping Start Game SHALL transition to round 1.

**F9 — End Screen**

- FR45: After round 30 + Finish tap, the app SHALL transition to the End screen.
- FR46: The End screen SHALL display: final score, personal best (or "—"), and a Play Again button.
- FR47: If the current score > stored PB (or no PB stored), the End screen SHALL also display a celebratory message from `new-high-score` AND update the stored PB in localStorage.
- FR48: Tapping Play Again SHALL begin a fresh 30-round game with new random questions, score 0, streak 0, hint flags reset.

**F10 — Animation & Motion**

- FR49: Screen transitions (Start ↔ Game ↔ End, question ↔ feedback ↔ next) SHALL use fade in/out animations.
- FR50: During speed rounds, when the timer reaches approximately 5 seconds remaining or less, on-screen elements SHALL shake/vibrate.
- FR51: The score count-up animation (FR35) SHALL trigger when points are awarded.
- FR52: All animations SHALL not block user interaction or significantly degrade mid-tier mobile performance.

**F11 — Content Loading**

- FR53: Question content SHALL be loaded from JSON files committed to `data/questions/`.
- FR54: Message-pool content SHALL be loaded from JSON files committed to the repo.
- FR55: Each question SHALL include a `menuRefs` field listing menu item keys it references; not used by runtime logic in v1.
- FR56: Question content SHALL be validated against TypeScript type definitions (runtime or build-time); malformed content SHALL trigger the error path in F12.

**F12 — Error Handling**

- FR57: If `localStorage` is unavailable, the game SHALL play normally; high-score features SHALL silently degrade with no visible error.
- FR58: If question or message JSON fails to load or validate, the app SHALL display a friendly error screen in the personality voice ("Something broke. Try refreshing.").

### NonFunctional Requirements

- NFR1: Static deployment — deployable as fully static HTML/CSS/JS/JSON bundle with no server-side runtime.
- NFR2: No external runtime APIs — no HTTP requests to external services during gameplay or content loading.
- NFR3: Browser support — latest 2 versions of Safari and Chrome on desktop and mobile.
- NFR4: Responsive layout — viewport widths 320px (small mobile) to 1920px (desktop); touch + pointer for Type A drag-to-order.
- NFR5: TypeScript source; runtime MAY be compiled JavaScript.
- NFR6: No authentication required; no accounts, no login.
- NFR7: Performance — full game playable without perceptible lag on representative mid-tier 2-year-old smartphone; initial load <3s on typical 4G.
- NFR8: Persistence — only personal-best high score persisted, stored in `localStorage` per device.
- NFR9: Automated tests required — unit + component coverage for all load-bearing FRs in F1–F7 using TypeScript-compatible DOM-environment test framework (e.g., Vitest + Testing Library + JSDOM). E2E browser-automation tests are NOT required for v1.

### Additional Requirements

**From Architecture:**

- **Starter template (foundational):** Project SHALL be initialized via `npm create vite@latest skilldares-app -- --template react-ts`. Scaffold replaces the existing `index.html` landing page in this repo. **This is the first implementation story.**
- **Core dependencies:** React 19, Vite (latest), Motion (`motion/react`, v12+), @dnd-kit/core + @dnd-kit/sortable (latest), Zod 4.4.3, Vitest (latest), React Testing Library + @testing-library/user-event, ESLint + Prettier + typescript-eslint.
- **Source code organization:** Components in `src/components/{start,game,end,shared}/`; pure logic in `src/lib/` (zero React imports); React Context in `src/state/`; UI strings in `src/content/uiStrings.ts`; global CSS in `src/styles/global.css`; JSON content in `data/questions/` and `data/messages/`.
- **State management:** React Context for game state; pure reducer (`gameReducer`) for transitions; no external state library.
- **Game state shape:** `Screen` discriminated union + current round + score + signed streak + hint-used-this-round + answered-rounds array.
- **Picker isolation:** `picker.ts` is a pure module; randomness injected as `Rng` parameter so tests are deterministic.
- **Discriminated-union actions:** Reducer accepts typed action objects (e.g., `{ type: 'ANSWER_QUESTION', payload: {...} }`), not string constants.
- **Zod schemas:** Define question and message schemas in `src/lib/schemas/`; derive TS types via `z.infer<>`; validate JSON at runtime on load.
- **Build-time content validation:** A `prebuild` script (`scripts/validate-content.ts`) parses all JSON content against Zod schemas; non-zero exit blocks the build.
- **Error handling:** Top-level React `<ErrorBoundary>` in `App.tsx` catches all uncaught render + content-validation errors → renders `<ErrorScreen />`.
- **localStorage wrapper:** All `localStorage` access through `src/lib/storage.ts` with try/catch; exposes `hasStorage()`, `getHighScore()`, `setHighScore()`.
- **AWS Amplify deployment:** Commit `amplify.yml` to repo; phases: `preBuild` (`npm ci`), `build` (`npm run build`); artifact baseDirectory: `dist`; cache: `node_modules/**/*`. Branch strategy: `main` → production.
- **Testing patterns:** Co-located `*.test.ts(x)` files; BDD-style `describe`/`it`; pure modules get 100% behavior coverage; component tests use `@testing-library/user-event`; tests use fixtures from `src/__fixtures__/` (never real content JSON).
- **TypeScript config:** Strict mode, `tsconfig.json` with appropriate Vite + React presets.
- **Vite config:** `build.target` set to modern (e.g., `es2022`); Vitest config inline.

### UX Design Requirements

- UX-DR1: Implement design tokens as CSS custom properties at `:root` in `src/styles/global.css`. Token categories: background (3), text (3), brand (3), answer-block (4), state (4), font families (3), type scale (7 `clamp()` values), spacing scale (8), radii (4), motion durations (3), easings (2). Specific hex values per UX spec §"Visual Design Foundation."
- UX-DR2: Integrate Google Fonts — Bricolage Grotesque (display, weights 400/500/700/800) + Inter (body, weights 400/500/600/700) — via `<link>` in `index.html`. Fallback stack: `system-ui, -apple-system, sans-serif`.
- UX-DR3: Implement Motion variants in `src/lib/motionVariants.ts`. Variants: `fadeIn`/`fadeOut` (screen transitions, ease-snappy, motion-base); `shake` (timer-low, brief, sharp); `countUp` (score awards, ease-bounce, motion-base); `confetti` (new-high-score celebration).
- UX-DR4: Implement `<StartScreen>` per Direction A: centered SKILLDARES title (display font, gold) + random `pre-game-encouragement` message (display font, xl, cream) + primary START GAME button.
- UX-DR5: Implement `<GameScreen>` container: thin header (score upper-right + question count + optional TimerDisplay) → current question component (MC/Order/Select) → FeedbackOverlay (conditional). Wraps screen transitions with `<AnimatePresence>`.
- UX-DR6: Implement `<QuestionMC>` as 2×2 grid of color-block quadrants (using `--color-answer-{1..4}`). Per-quadrant states: `default`, `locked`, `correct-reveal`, `greyed-out` (post-hint), `muted`. Each quadrant is a `<button>`; correct/wrong reveal includes ✓/✗ icons (color-not-alone).
- UX-DR7: Implement `<QuestionOrder>` (Speed Type A) using `@dnd-kit/sortable` `SortableContext` + `useSortable`. Enable PointerSensor, TouchSensor, KeyboardSensor. Submit reveals factor values beneath each row. Row drag handle (`≡`) visual + entire row draggable.
- UX-DR8: Implement `<QuestionSelect>` (Speed Type B) as grid of 5 squares with tap-to-toggle selection. Selected squares show ✓ overlay. Submit reveals per-square correctness with ✓/✗ overlays for both selected-correct and unselected-correct.
- UX-DR9: Implement `<ScoreDisplay>` with count-up animation on score change (`--motion-base` duration, `--ease-bounce`).
- UX-DR10: Implement `<TimerDisplay>` as a visual progress bar (not text countdown). At ≤5 seconds remaining, shift to `--color-state-warning` and trigger shake variant. Honor `prefers-reduced-motion` for shake. Expose `aria-live="polite"` region with seconds remaining.
- UX-DR11: Implement `<HintButton>` (MC rounds only) as a secondary-style pill with 💡 icon + "Hint" label, ≥44pt tall. States: `available`, `used` (disabled after tap).
- UX-DR12: Implement `<FeedbackOverlay>` (Beat 2 of the answer loop). Anatomy: big ✓/✗ icon + personality message (display font, 3xl) + points indicator + Next/Finish button revealed ~400ms after verdict. 5 visual variants matching message pool: `correct`, `wrong`, `on-fire`, `streak-broken`, `comeback`. Use `role="alert"` for screen-reader announcement.
- UX-DR13: Implement `<EndScreen>` with 2 variants: standard (score + PB + RUN IT BACK) and celebrating (new PB: confetti + accent color + new-high-score pool message + sustained beat).
- UX-DR14: Implement shared `<Button>` primitive with `variant="primary"` (bold gold, ≥56pt tall) and `variant="secondary"` (muted pill, ≥44pt tall). Default browser focus ring preserved (don't suppress `:focus-visible`).
- UX-DR15: Implement shared `<ItemSquare>` primitive reused inside `<QuestionOrder>` and `<QuestionSelect>`. Visual treatment driven by parent context (draggable row vs selectable square).
- UX-DR16: Implement `<ErrorScreen>` (FR58 visualization). Big ✗ + voice-laden error message + sub-text. `role="alert"`. No retry button; only fix is refresh.
- UX-DR17: Author all UI copy in `src/content/uiStrings.ts` with voice consistent with the message pools. Specific strings: `START GAME`, `LOCK IT IN`, `NEXT →`, `FINISH IT`, `RUN IT BACK`, `💡 Hint`, error copy ("Something broke. Try refreshing."), end-screen prompts.
- UX-DR18: Responsive layout per breakpoints — mobile (320–767px): single column, full-width, touch targets ≥44pt; tablet (768–1023px): same layout, max-width 640px centered; desktop (1024px+): same layout at 640px max-width with generous margins. No layout pivots across breakpoints.
- UX-DR19: Honor `prefers-reduced-motion` specifically for the timer shake animation. Other animations remain on.
- UX-DR20: Add basic ARIA semantics: `<button>` for interactive elements (not `<div>`); `aria-label` on icon-only HintButton; `aria-live="polite"` on TimerDisplay; `role="alert"` on FeedbackOverlay + ErrorScreen.

### FR Coverage Map

| FR | Epic | Notes |
| --- | --- | --- |
| FR1 | 1 (partial) → 2 (full) | 15 rounds in Epic 1, expanded to 30 in Epic 2 |
| FR2 | 1 (partial) → 2 (full) | MC only in Epic 1; full MC+Speed split in Epic 2 |
| FR3 | 2 | Speed Type A/B split |
| FR4–FR7 | 1 | Game state, score display |
| FR8–FR11 | 1 | MC mechanics |
| FR12–FR18 | 2 | Speed Type A drag-to-order |
| FR19–FR24 | 2 | Speed Type B multi-select |
| FR25–FR29 | 1 | Hint mechanic |
| FR30–FR32 | 1 | MC scoring (5/2/0) |
| FR33–FR34 | 2 | Timer expiry, speed all-or-nothing |
| FR35 | 1 | Score count-up animation |
| FR36–FR41 | 1 | Personality message system |
| FR42–FR44 | 1 | Start screen |
| FR45–FR46 | 1 | End screen base |
| FR47 | 3 | New-high-score celebration |
| FR48 | 1 | Play Again |
| FR49 | 1 | Fade transitions |
| FR50 | 2 | Shake on low timer |
| FR51 | 1 | Score animation |
| FR52 | 1 | Performance |
| FR53–FR56 | 1 | Content loading + Zod validation |
| FR57–FR58 | 1 | Error handling |

All 58 FRs covered across 3 epics.

## Epic List

### Epic 1: Deployable MC Game — Foundation + Multiple-Choice Round ✅ Complete (2026-05-24)

**User outcome:** A new server opens the public URL, plays through a 15-round MC-only game with hints, scoring, and the irreverent personality voice. The end screen shows the final score and personal best (no celebration variant yet). The full product foundation is in place — speed rounds follow in Epic 2.

**FRs covered:** FR1 (partial — 15 rounds), FR2 (MC portion), FR4–FR11, FR25–FR32, FR35–FR46, FR48, FR49, FR51–FR58.

**UX-DRs covered:** UX-DR1, UX-DR2, UX-DR3 (partial — fade + count-up), UX-DR4, UX-DR5, UX-DR6, UX-DR9, UX-DR11, UX-DR12 (partial), UX-DR13 (standard variant), UX-DR14, UX-DR16, UX-DR17, UX-DR18, UX-DR19 (baseline), UX-DR20.

**Implementation notes:** Includes scaffold + dependencies + AWS Amplify deploy as foundation stories. Delivers a complete working app — just MC-only. Establishes all foundational architecture (state, content pipeline, error boundary, design tokens). Stories ordered: foundation → pure logic → components → integration.

### Epic 2: Add Speed Rounds — Full 30-Round Production Game ✅ Complete (2026-05-24)

**User outcome:** Full 30-round game with MC + drag-to-order + multi-select speed rounds. The 15-second timer + shake-on-low urgency lands. The product is now spec-complete (minus the new-high-score celebration polish).

**FRs covered (fully):** FR1 (now full 30 rounds), FR2 (full split), FR3 (50/50 Type A/B), FR12–FR24, FR33–FR34, FR50.

**UX-DRs covered:** UX-DR3 (adds shake variant), UX-DR7, UX-DR8, UX-DR10, UX-DR15, UX-DR19 (full).

**Implementation notes:** Extends game loop to 30 rounds, adds 2 new question component types + timer + dnd-kit integration. Requires speed-round question content authoring (40 Type A + 40 Type B questions).

### Epic 3: New-High-Score Celebration ✅ Complete (2026-05-24)

**User outcome:** Beating the personal best triggers a distinctive celebratory moment — confetti, accent color, dedicated celebratory message pool. The most positively-charged emotional beat of the game lands properly.

**FRs covered (fully):** FR47.

**UX-DRs covered:** UX-DR3 (adds confetti variant), UX-DR12 (new-high-score visual variant), UX-DR13 (celebrating variant).

**Implementation notes:** Smallest epic but delivers the product's most distinctive emotional moment. Includes authoring the ~20-message `new-high-score` pool, implementing confetti motion variant, and adding the EndScreen's celebrating variant.

---

## Epic 1: Deployable MC Game — Foundation + Multiple-Choice Round ✅ Complete (2026-05-24)

A new server opens the public URL, plays through a 15-round MC-only game with hints, scoring, and the irreverent personality voice. The end screen shows final score and personal best. The full product foundation is in place — speed rounds follow in Epic 2.

### Story 1.1: Project Scaffold + AWS Amplify Deployment

As a developer,
I want to scaffold the Vite + React + TypeScript project and connect it to AWS Amplify,
So that we have a clean foundation deployed to a live URL before any feature work begins.

**Acceptance Criteria:**

**Given** an empty target directory
**When** I run `npm create vite@latest skilldares-app -- --template react-ts` and merge the scaffold into this repo (replacing the existing `index.html`)
**Then** the repo contains `package.json`, `tsconfig.json` (strict mode), `vite.config.ts`, `src/main.tsx`, `src/App.tsx`, and `index.html`
**And** `npm install` completes successfully
**And** `npm run dev` starts the Vite dev server on http://localhost:5173 with HMR
**And** `npm run build` produces a static bundle in `dist/`

**Given** the scaffold is in place
**When** I commit `amplify.yml` to the repo with `preBuild: npm ci`, `build: npm run build`, artifact baseDirectory `dist`, cache `node_modules/**/*`
**And** I configure AWS Amplify to deploy from the `main` branch
**Then** pushing to `main` triggers a successful Amplify build and deploy
**And** the deployed app is reachable at a public HTTPS URL
**And** the URL displays the default Vite + React scaffold page

### Story 1.2: Design Tokens + Google Fonts Integration

As a developer,
I want the design system tokens established and the type families loaded,
So that every component built afterward can consume them via `var(--...)` without hardcoded values.

**Acceptance Criteria:**

**Given** the scaffold from Story 1.1 exists
**When** I create `src/styles/global.css` with all tokens specified in UX spec §"Visual Design Foundation" (color, type, spacing, radii, motion, easings) at `:root`
**And** I import `global.css` from `src/main.tsx`
**Then** all token CSS custom properties are accessible from any component CSS Module
**And** the page background reflects `--color-bg-default` (`#0e1117`)
**And** the document text color reflects `--color-text-primary` (`#f4ead5`)

**Given** Google Fonts CDN is reachable
**When** I add `<link>` tags in `index.html` for Bricolage Grotesque (weights 400/500/700/800) and Inter (weights 400/500/600/700)
**Then** display text rendered with `font-family: var(--font-display)` shows Bricolage Grotesque
**And** body text rendered with `font-family: var(--font-body)` shows Inter
**And** when fonts fail to load, the fallback stack `system-ui, -apple-system, sans-serif` renders cleanly

### Story 1.3: Zod Schemas + Build-Time Content Validation

As a developer,
I want Zod schemas for all content types and a pre-build validation script,
So that malformed content fails the build before it can ever ship.

**Acceptance Criteria:**

**Given** the foundation is in place
**When** I create `src/lib/schemas/question.schema.ts` defining `MultipleChoiceQuestionSchema`, `SpeedOrderQuestionSchema`, `SpeedSelectQuestionSchema`, each with a `menuRefs` field, and export TypeScript types via `z.infer<>`
**And** I create `src/lib/schemas/message.schema.ts` defining a `MessagePoolSchema` (array of strings)
**Then** all question and message types throughout the codebase are imported from these schema modules — never hand-written separately

**Given** the schema modules exist
**When** I create `scripts/validate-content.ts` that loads every JSON file in `data/questions/` and `data/messages/` and runs the appropriate Zod schema's `.parse()` on each
**And** I add `"prebuild": "tsx scripts/validate-content.ts"` to `package.json`
**Then** running `npm run build` invokes the validation script first
**And** if any JSON file fails validation, the build exits with a non-zero code and prints the validation errors

### Story 1.4: Author Multiple-Choice Question Content

As a developer (content author),
I want ≥200 multiple-choice questions authored as JSON,
So that the MC rounds have variety and replays don't feel repetitive.

**Acceptance Criteria:**

**Given** the menu source files (`data/menu_front.md`, `data/menu_back.md`) and the schema from Story 1.3
**When** I use an external LLM chat session to generate ≥200 MC questions covering food + drinks across most of the menu
**And** each question contains: prompt, 4 options (1 correct, 1 obviously-wrong-and-funny, 2 close-distractors), correctIndex, `menuRefs`
**And** question shapes include ingredient listing, pricing, and attribute/category (GF, etc.)
**Then** the committed `data/questions/multiple-choice.json` parses successfully against `MultipleChoiceQuestionSchema`
**And** the file has ≥200 questions
**And** the build-time validation script passes

### Story 1.5: Author Message Pool Content (Epic 1 Pools)

As a developer (content author),
I want the 7 message pools used in Epic 1 authored as JSON,
So that the personality voice has enough variety to feel fresh across plays.

**Acceptance Criteria:**

**Given** the message schema from Story 1.3 and the voice direction in the brief + UX spec
**When** I author 50 messages each for pools: `pre-game-encouragement`, `right-no-streak`, `wrong-no-streak`, `on-fire`, `doing-bad`, `streak-broken`, `comeback`
**And** each message reflects the irreverent voice (sharp, willing to be harsh/profane, willing to praise hard)
**Then** the 7 files in `data/messages/*.json` each contain ~50 messages
**And** each parses successfully against `MessagePoolSchema`
**And** the build-time validation passes
**And** the total committed message count for Epic 1 pools is approximately 350

### Story 1.6: Pure Logic Modules — Scoring, Streak, Picker, Question Selection

As a developer,
I want the four pure-logic modules implemented with unit tests,
So that the game's deterministic core can be tested in isolation per NFR9.

**Acceptance Criteria:**

**Given** the project structure from prior stories
**When** I implement `src/lib/scoring.ts` exporting `computePoints(isCorrect, usedHint)` returning 5/2/0 per FR30–FR32
**And** I implement `src/lib/streak.ts` exporting `nextStreak(previousStreak, isCorrect)` per FR4 + FR38 streak rules
**And** I implement `src/lib/picker.ts` exporting `pickPool(previousStreak, isCorrect, isNewHighScore?)` returning a `PoolId` per FR38
**And** I implement `src/lib/questionSelection.ts` exporting `selectGame(pool, rng)` returning 30 questions per FR6 (or 15 for Epic 1 milestone) with the round-structure constraint
**Then** none of these modules import React, the DOM, or any I/O library
**And** each has a co-located `*.test.ts` file with full behavior coverage (correct, wrong, streak edges, hint flag, random draw determinism with injected `rng`)
**And** running `npm test` passes all suites

### Story 1.7: localStorage Wrapper + High Score Hook

As a developer,
I want a guarded `localStorage` wrapper and a `useHighScore` hook,
So that the app degrades silently when storage is unavailable (FR57).

**Acceptance Criteria:**

**Given** the project foundation
**When** I implement `src/lib/storage.ts` with `hasStorage()`, `getHighScore()`, `setHighScore(n)` all wrapped in try/catch
**Then** when `localStorage` throws (e.g., private browsing), `hasStorage()` returns `false` and `get/setHighScore` are no-ops returning `null`/`void` without throwing
**And** when `localStorage` works, the high score persists between page reloads
**And** the module has a co-located `storage.test.ts` covering both available and unavailable cases (using a JSDOM-stubbed `localStorage`)

**Given** the storage wrapper exists
**When** I implement `src/state/useHighScore.ts` exposing `{ highScore, updateHighScore, hasStorage }`
**Then** components consuming this hook never call `localStorage` directly

### Story 1.8: Game Reducer + Provider + State Hook

As a developer,
I want the gameReducer + GameProvider + useGameState hook implemented,
So that the rest of the app can consume game state via a single clean interface.

**Acceptance Criteria:**

**Given** the pure logic modules from Story 1.6
**When** I implement `src/lib/gameReducer.ts` as a pure reducer over `GameState` with discriminated-union `Action` types (`START_GAME`, `ANSWER_QUESTION`, `USE_HINT`, `ADVANCE_TO_NEXT`, `FINISH_GAME`, `PLAY_AGAIN`)
**Then** the reducer is pure — no React imports, no side effects, all randomness/timing injected
**And** the reducer composes `scoring`, `streak`, and `picker` to compute new state on `ANSWER_QUESTION`
**And** `gameReducer.test.ts` covers all transitions including streak-edge cases and hint-used scoring

**Given** the reducer exists
**When** I implement `src/state/GameProvider.tsx` (wraps `useReducer(gameReducer)` in a React Context) and `src/state/useGameState.ts` (returns `{ state, dispatch, helpers }`)
**Then** components can consume game state and dispatch actions through `useGameState()` without importing the Context directly

### Story 1.9: Shared Primitives — Button, motionVariants, uiStrings, ErrorScreen, ErrorBoundary

As a developer,
I want the shared primitives + error infrastructure in place,
So that subsequent screen/component stories can depend on them.

**Acceptance Criteria:**

**Given** design tokens from Story 1.2
**When** I implement `src/components/shared/Button.tsx` with `variant="primary"` (gold, ≥56pt) and `variant="secondary"` (pill, ≥44pt)
**Then** both variants honor design tokens; component tests verify rendering, click handling, and disabled state

**Given** design tokens exist
**When** I implement `src/lib/motionVariants.ts` exporting `fadeIn`, `fadeOut`, `countUp` variants using `--motion-base` + `--ease-snappy` and `--ease-bounce`
**Then** all components requiring fade or count-up animations consume from this single module — no inline animation values

**When** I implement `src/content/uiStrings.ts` containing every UI string (START GAME, LOCK IT IN, NEXT →, FINISH IT, RUN IT BACK, 💡 Hint, error copy, end-screen prompts) authored in the personality voice
**Then** no component contains hardcoded English text — everything comes from `uiStrings.ts`

**Given** the Button + uiStrings exist
**When** I implement `src/components/shared/ErrorScreen.tsx` (big ✗ + voice-laden error message + sub-text, `role="alert"`)
**And** I wrap `<App>` in a top-level `<ErrorBoundary>` that catches all uncaught render errors + content-validation throws and renders `<ErrorScreen />`
**Then** any uncaught error or Zod validation failure displays the voice-laden error screen instead of a stack trace (FR58)

### Story 1.10: Start Screen

As a player,
I want a clean, irreverent start screen that pulls me into the game without instructions,
So that the personality lands immediately and I can begin without friction.

**Acceptance Criteria:**

**Given** the design tokens + Button + uiStrings + pre-game-encouragement pool exist
**When** I implement `src/components/start/StartScreen.tsx` rendering the SKILLDARES wordmark (display font, gold) + a random message from the `pre-game-encouragement` pool + a primary START GAME button
**Then** every page mount picks a different (or same, by uniform random) message from the pool
**And** no instructions, rules text, or onboarding tutorial appears (per FR43)
**And** tapping START GAME dispatches `START_GAME` to the reducer and transitions to the game screen (verified in integration story 1.16)
**And** `StartScreen.test.tsx` covers rendering with a mocked random message and asserting the START button dispatches correctly

### Story 1.11: Score Display

As a player,
I want my running score visible in the upper-right at all times during play,
So that I can see how I'm doing without leaving the question.

**Acceptance Criteria:**

**Given** game state contains a `score` integer
**When** I implement `src/components/game/ScoreDisplay.tsx` showing "Score: {n}" in display font in the upper-right of the GameScreen header
**Then** when the score changes, the displayed number animates count-up from previous to new value using `--motion-base` + `--ease-bounce` (per FR35)
**And** the count-up animation does not block interaction with other UI elements
**And** `ScoreDisplay.test.tsx` covers initial render, score change with animation trigger, and that no animation occurs when score stays the same

### Story 1.12: Hint Button

As a player,
I want a Hint button on MC questions that lets me trade points for a hint,
So that I have a real decision to make on harder questions.

**Acceptance Criteria:**

**Given** game state tracks `hintUsedThisRound`
**When** I implement `src/components/game/HintButton.tsx` as a secondary-style pill (≥44pt) with 💡 icon + "Hint" label, bottom-center
**Then** tapping the button dispatches `USE_HINT` to the reducer
**And** after `USE_HINT`, the button is visually disabled and cannot be tapped again for the current question
**And** the reducer's `USE_HINT` action triggers the QuestionMC to grey out one random wrong answer (FR27)
**And** `HintButton.test.tsx` covers default state, used state, and that disabled button doesn't dispatch on second tap

### Story 1.13: Multiple-Choice Question Component

As a player,
I want a clear 4-quadrant MC question I can answer with a single tap,
So that the answer mechanic feels obvious from round 1.

**Acceptance Criteria:**

**Given** the QuestionMC component receives a question via props (prompt, 4 options, correctIndex, menuRefs)
**When** I implement `src/components/game/QuestionMC.tsx` as a 2×2 grid using `--color-answer-1` through `--color-answer-4`
**And** each quadrant is a `<button>` with answer text centered, ≥120pt tall
**Then** tapping a quadrant locks the answer (cannot change) and dispatches `ANSWER_QUESTION` with the selected option index and the `usedHint` flag
**And** post-answer, the correct quadrant displays a ✓ overlay, the wrong-and-selected quadrant displays a ✗ overlay, the other two quadrants are visually muted
**And** when `USE_HINT` has been dispatched, one randomly-chosen wrong quadrant is rendered as greyed-out and non-tappable
**And** `QuestionMC.test.tsx` covers default render, tap-to-answer, post-answer reveal states, and post-hint greyed state

### Story 1.14: Feedback Overlay (5 Epic-1 Variants)

As a player,
I want the personality voice to land after every answer with a clear correct/incorrect verdict,
So that the post-answer beat feels charged and the voice gets stage time.

**Acceptance Criteria:**

**Given** game state contains `currentFeedback` (`{ isCorrect, message, pointsAwarded, pool }`) after an answer
**When** I implement `src/components/game/FeedbackOverlay.tsx` rendering a big ✓ or ✗ icon, the personality message (display font, 3xl), the points indicator, and a Next/Finish button
**Then** the Next/Finish button appears with a ~400ms delay after the verdict (read time before user can advance)
**And** the overlay supports 5 visual variants matching pool: `right-no-streak`, `wrong-no-streak`, `on-fire` (brand-accent tint), `streak-broken` (dramatic red), `comeback` (celebratory tint)
**And** the overlay uses `role="alert"` so screen readers announce the verdict and message
**And** tapping Next dispatches `ADVANCE_TO_NEXT`; on round 30 the button label says "FINISH IT" (or equivalent voice copy) and dispatches `FINISH_GAME`
**And** `FeedbackOverlay.test.tsx` covers all 5 variants, the 400ms reveal delay, and the Next/Finish dispatch

### Story 1.15: Game Screen Orchestrator

As a player,
I want the gameplay UI assembled so that the question, score, and feedback all work as a single coherent screen,
So that round-to-round play feels seamless.

**Acceptance Criteria:**

**Given** ScoreDisplay, HintButton, QuestionMC, and FeedbackOverlay all exist
**When** I implement `src/components/game/GameScreen.tsx` as a header (ScoreDisplay + "Q {n}/{total}") + conditional render of QuestionMC + FeedbackOverlay (when `state.currentFeedback` is set)
**Then** during the question state, the user sees QuestionMC with the HintButton and no overlay
**And** after answering, the user sees the FeedbackOverlay
**And** the header score animates count-up when the score changes
**And** `GameScreen.test.tsx` covers transitioning from question state to feedback state and back to a new question

### Story 1.16: End Screen (Standard Variant)

As a player,
I want to see my final score and personal best at the end of a game with a clear Play Again button,
So that I know how I did and can immediately try again.

**Acceptance Criteria:**

**Given** game state has transitioned to `screen: 'end'` after round 30 (or round 15 for Epic 1 milestone) and `useHighScore()` provides the stored personal best
**When** I implement `src/components/end/EndScreen.tsx` showing the final score (display font, large gold), the personal best as "Best: {n}" (or "—" if no PB), and a primary RUN IT BACK button
**Then** if the current score is NOT greater than the stored PB, the standard variant renders (no confetti, no celebration)
**And** the End screen pulls a message from a generic/wrong/right-style pool to acknowledge the result (no new-high-score celebration in Epic 1 — that's Epic 3)
**And** tapping RUN IT BACK dispatches `PLAY_AGAIN` to the reducer, which resets state and draws fresh questions
**And** if the current score IS greater than the stored PB, the high score is silently updated via `useHighScore` (the celebratory display is added in Epic 3)
**And** `EndScreen.test.tsx` covers standard render with PB present, no-PB-yet first-play render, and Play Again dispatch

### Story 1.17: Integration + Production Deploy

As a developer,
I want the MC-only game integrated, smoke-tested, and deployed to production via Amplify,
So that the Epic 1 milestone is a live, shareable URL.

**Acceptance Criteria:**

**Given** all Epic 1 components and stories are merged
**When** I run the full game end-to-end locally: open the URL → see Start screen → tap START GAME → play through 15 MC rounds (with hint usage on at least one) → reach End screen → tap RUN IT BACK → start a fresh game
**Then** the entire flow works without runtime errors, console warnings, or visual glitches
**And** the personality message appears after every answer
**And** the score animates count-up on every points-awarded event
**And** the running score is visible at all times
**And** localStorage high score persists across browser sessions

**Given** the local smoke test passes
**When** I push to `main` and AWS Amplify deploys the build
**Then** the build passes the prebuild content validation
**And** the live URL serves a fully functional 15-round MC game
**And** the game works equally well on a mobile Safari/Chrome and a desktop browser

---

## Epic 2: Add Speed Rounds — Full 30-Round Production Game ✅ Complete (2026-05-24)

Full 30-round game with MC + drag-to-order + multi-select speed rounds, with the 15-second timer and shake-on-low urgency.

### Story 2.1: Author Speed Round Type A (Drag-to-Order) Content

As a developer (content author),
I want 40 Type A drag-to-order questions authored as JSON,
So that the order-based speed rounds have variety across replays.

**Acceptance Criteria:**

**Given** the menu source files and the schema (to be extended in Story 2.3)
**When** I generate 40 Type A questions, each with: prompt ("Order by price/ABV"), 3–5 items, correct order, factor type (price or ABV), `menuRefs`
**And** factors are limited to price and ABV (ABV only on drinks)
**Then** `data/questions/speed-order.json` contains 40 questions parsing against `SpeedOrderQuestionSchema`
**And** the build-time validation passes

### Story 2.2: Author Speed Round Type B (Multi-Select) Content

As a developer (content author),
I want 40 Type B multi-select questions authored as JSON,
So that the criteria-based speed rounds have variety.

**Acceptance Criteria:**

**Given** the menu source files and the schema
**When** I generate 40 Type B questions, each with: prompt ("Select items in [dish]" / "Select items that are GF" / "Select items in [section]"), exactly 5 items, correct subset (at least one item, up to all 5), `menuRefs`
**And** distractor items in the 5 are real menu items from adjacent dishes — never random text
**Then** `data/questions/speed-select.json` contains 40 questions parsing against `SpeedSelectQuestionSchema`
**And** the build-time validation passes

### Story 2.3: Extend Schemas + Game State + Question Selection for Speed Rounds

As a developer,
I want the schemas, reducer, and selection logic extended to support 30-round games with speed rounds,
So that the game now matches the full PRD spec.

**Acceptance Criteria:**

**Given** the Epic 1 schemas exist
**When** I extend `src/lib/schemas/question.schema.ts` to fully specify `SpeedOrderQuestionSchema` and `SpeedSelectQuestionSchema` and a discriminated-union `QuestionSchema` over all three types
**Then** all three pools parse against their respective schemas

**Given** the schemas are updated
**When** I update `src/lib/questionSelection.ts` to draw 30 questions total: 15 from MC, 7 or 8 from Type A, 7 or 8 from Type B (±1 tolerance per FR3)
**And** I update `gameReducer.ts` to handle the full 30-round flow and treat speed-round answer payloads (order array, selection set) correctly
**Then** `questionSelection.test.ts` and `gameReducer.test.ts` cover the 30-round flow with mixed question types
**And** the Epic 1 milestone's 15-round MC-only behavior can still be reached via a feature flag or constant (to avoid breaking until full deploy)

### Story 2.4: ItemSquare Shared Primitive

As a developer,
I want a reusable `<ItemSquare>` primitive used inside both QuestionOrder and QuestionSelect,
So that the visual treatment of menu items in speed rounds is consistent.

**Acceptance Criteria:**

**Given** design tokens exist
**When** I implement `src/components/shared/ItemSquare.tsx` as a rounded rectangle with item text centered, accepting `variant` (`draggable` | `selectable` | `revealed-*`) and content props
**Then** the visual treatment matches the UX spec mockup for each variant
**And** `ItemSquare.test.tsx` covers all variants render correctly and props are passed through

### Story 2.5: Timer Display + useTimer Hook

As a player,
I want a visible countdown timer with visual urgency at low time,
So that the speed round pressure feels real but motivating, not panicking.

**Acceptance Criteria:**

**Given** I'm on a speed round
**When** I implement `src/state/useTimer.ts` (exposes `secondsRemaining`, starts/stops with the question lifecycle) and `src/components/game/TimerDisplay.tsx` (visual progress bar, not text)
**Then** the timer starts at 15 seconds when the question is presented
**And** the bar smoothly depletes over 15 seconds
**And** when ≤5 seconds remain, the bar shifts to `--color-state-warning` AND triggers the shake variant from `motionVariants.ts` (added in this story)
**And** `prefers-reduced-motion` disables the shake but keeps the color shift
**And** the TimerDisplay exposes an `aria-live="polite"` region announcing seconds remaining at low time
**And** when the timer hits 0, `useTimer` dispatches a timer-expiry event to the reducer, scoring the round as wrong (FR17, FR33)
**And** `TimerDisplay.test.tsx` covers normal countdown, low-time shake activation, and timer-expiry dispatch

### Story 2.6: QuestionOrder Component (Speed Type A)

As a player,
I want to drag menu items into the correct order on a touchscreen or mouse,
So that the drag-to-order speed round works reliably on my phone.

**Acceptance Criteria:**

**Given** dnd-kit dependencies are installed (Story 1.1) and ItemSquare exists (Story 2.4)
**When** I implement `src/components/game/QuestionOrder.tsx` using `<SortableContext>` + `useSortable` with `PointerSensor`, `TouchSensor`, and `KeyboardSensor` enabled
**Then** items can be dragged into any order via touch on mobile Safari and Chrome, via mouse on desktop, and via keyboard with `Tab` + arrow keys
**And** the drag interaction has a snappy pickup (slight scale + shadow) and satisfying release
**And** below the items, a primary `LOCK IT IN` button dispatches `ANSWER_QUESTION` with the current order
**And** post-submit, each item reveals its factor value beneath the row, and the question is scored all-or-nothing (5 for exact order match, 0 otherwise)
**And** if the 15-second timer expires before submit, the question is auto-scored as wrong
**And** `QuestionOrder.test.tsx` covers default render, drag-to-reorder via keyboard sensor (most testable), submit dispatch with correct order, and post-submit reveal states

### Story 2.7: QuestionSelect Component (Speed Type B)

As a player,
I want to tap to select all squares matching a criteria,
So that the multi-select speed round is fast and unambiguous.

**Acceptance Criteria:**

**Given** ItemSquare exists (Story 2.4)
**When** I implement `src/components/game/QuestionSelect.tsx` as a grid of 5 ItemSquares with tap-to-toggle selection (each is `aria-pressed="true|false"`)
**Then** tapping an unselected square selects it (shows ✓ overlay); tapping a selected square deselects it
**And** below the grid, a primary `LOCK IT IN` button dispatches `ANSWER_QUESTION` with the current selection set
**And** post-submit, the app reveals which selections were right/wrong via ✓/✗ overlays on each square (selected-correct, selected-wrong, unselected-correct, unselected-wrong all visually distinct)
**And** the question is scored all-or-nothing (5 for exact set match, 0 otherwise)
**And** timer expiry auto-scores as wrong
**And** `QuestionSelect.test.tsx` covers default render, toggle selection, submit dispatch, post-submit reveal states

### Story 2.8: Speed-Round Integration + Full 30-Round Production Deploy

As a developer,
I want the full 30-round game integrated, smoke-tested, and deployed to production,
So that Epic 2 ships the spec-complete game.

**Acceptance Criteria:**

**Given** all Epic 2 components are merged into the main branch
**When** I run a full 30-round game end-to-end locally: 15 MC rounds → 15 speed rounds (mix of Type A and Type B) → end screen → Play Again
**Then** the entire flow works without runtime errors or glitches
**And** drag-and-drop in Type A works reliably on a real mobile device (iPhone Safari + Android Chrome)
**And** the timer shake activates at ≤5 seconds and respects `prefers-reduced-motion`
**And** speed-round all-or-nothing scoring works correctly (exact match = 5, anything off = 0)
**And** the production deploy via Amplify serves the full 30-round game at the live URL

---

## Epic 3: New-High-Score Celebration ✅ Complete (2026-05-24)

Beating the personal best triggers a distinctive celebratory moment — confetti, accent color, dedicated celebratory message pool.

### Story 3.1: Author new-high-score Message Pool

As a developer (content author),
I want ~20 celebratory messages authored for the new-high-score pool,
So that beating the PB lands with personality variety.

**Acceptance Criteria:**

**Given** the message schema exists
**When** I author ~20 messages in the same irreverent voice but explicitly celebratory (e.g., "Holy shit, look at you.")
**Then** `data/messages/new-high-score.json` contains ~20 messages
**And** parses against `MessagePoolSchema`
**And** the build-time validation passes

### Story 3.2: Confetti Motion Variant

As a player,
I want a visible celebration animation when I beat my high score,
So that the moment feels memorable.

**Acceptance Criteria:**

**Given** Motion is integrated in the project
**When** I implement a `confetti` variant in `src/lib/motionVariants.ts` (multi-colored particle burst using `--color-answer-{1..4}` + `--color-brand-primary` + `--color-brand-accent`)
**Then** the variant can be triggered on a top-level container of the End screen
**And** the animation runs for approximately 2–3 seconds then settles
**And** the animation respects `prefers-reduced-motion` (degrades to a static accent-color flash instead of moving particles)
**And** a small Motion-component test (`confetti.test.tsx`) confirms the variant renders without crashing

### Story 3.3: End Screen Celebrating Variant

As a player,
I want the End screen to look distinctly different when I beat my high score,
So that the achievement is unmistakable.

**Acceptance Criteria:**

**Given** the standard EndScreen from Story 1.16 + the confetti variant from Story 3.2 + the new-high-score pool from Story 3.1
**When** I extend `src/components/end/EndScreen.tsx` to render the celebrating variant when `currentScore > storedPB`
**Then** the celebrating variant shows: confetti overlay, "🎉 NEW HIGH SCORE! 🎉" in accent color (display font, 2xl), the final score in accent color (instead of standard gold), "Was: {previousPB}" beneath, and a random message from the `new-high-score` pool (display font, xl)
**And** the standard variant continues to render correctly when the score doesn't beat the PB
**And** the high score is updated to the new value (via `useHighScore.updateHighScore`)
**And** if no PB was previously stored, the first completed game's score triggers the celebrating variant
**And** `EndScreen.test.tsx` adds coverage for the celebrating variant (with new PB) and the score-update side effect

### Story 3.4: Final Polish + Production Deploy

As a developer,
I want the celebration moment tested end-to-end and deployed to production,
So that Epic 3 ships the complete product including the most positively-charged emotional beat.

**Acceptance Criteria:**

**Given** Stories 3.1–3.3 are merged
**When** I play a full game with a score lower than my PB, then a game with a score higher than my PB
**Then** the first game shows the standard End screen
**And** the second game shows the celebrating variant with confetti, accent color, and a `new-high-score` pool message
**And** the high score in localStorage is updated to the new value
**And** the production deploy via Amplify serves the celebrating variant correctly

---

## Project v1 status: ✅ Complete

**Shipped:** 2026-05-24
**Live at:** https://www.skilldares.com/

- 29 of 29 planned stories implemented across 3 epics
- 290 tests passing (28 test files)
- ~159 kB gzipped JS bundle (well under the 200 kB mobile budget)
- AWS Amplify continuous deployment from `main`

Skilldares v1 ships the full menu-memorization quiz: 15 multiple-choice rounds, 15 speed rounds (drag-to-order + multi-select), personality-driven feedback across 8 message pools, a confetti-and-accent-color celebration when the player beats their high score, and graceful localStorage degradation for private-browsing sessions.
