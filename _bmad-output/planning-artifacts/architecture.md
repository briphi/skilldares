---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-skilldares-2026-05-23/prd.md
  - _bmad-output/planning-artifacts/prds/prd-skilldares-2026-05-23/.decision-log.md
  - _bmad-output/planning-artifacts/briefs/brief-skilldares-2026-05-23/brief.md
  - _bmad-output/planning-artifacts/briefs/brief-skilldares-2026-05-23/.decision-log.md
workflowType: 'architecture'
lastStep: 8
status: 'complete'
project_name: 'skilldares'
user_name: 'Briphi'
date: '2026-05-23'
completedAt: '2026-05-23'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:** 58 FRs across 12 feature groups (F1 Game Loop → F12 Error Handling). Game shape: 30 rounds, 3 question types (MC, drag-order, multi-select), 8 message pools driven by a streak-aware picker, hint mechanic on MC only, all-or-nothing scoring on speed rounds, localStorage high score, animated UI with shake-on-urgency.

**Non-Functional Requirements:** Static deploy, no external runtime APIs, modern Safari + Chrome (mobile + desktop), responsive 320–1920px, TypeScript source, no auth, performance bar for mid-tier mobile, localStorage as the only persisted state, automated unit + component tests required (E2E excluded).

**Scale & Complexity:**
- Primary domain: Frontend SPA (browser-only, no backend)
- Complexity level: Low-to-medium
- Estimated architectural components: ~10–15
- Single user, single session, no data layer beyond JSON content + one localStorage entry

### Technical Constraints & Dependencies

- TypeScript as language constraint (NFR5); framework, build tool, and animation library all open for architecture-stage decision
- No HTTP requests to external services at runtime (NFR2); all content lives in-bundle as JSON
- AWS Amplify is the chosen deploy target (push from `main`); `amplify.yml` must live in repo
- Modern-only browser support (latest 2 Safari + Chrome on mobile + desktop) — modern Web APIs are fair game

### Cross-Cutting Concerns Identified

- **Drag-and-drop on touch + mouse** — FR14 explicitly requires both; flagged as a counter-metric risk in PRD §8
- **Motion system** — fade transitions, shake-on-low-timer, count-up score animation (FR49–FR52)
- **Content validation** — JSON pools validated against TypeScript types at load (FR56)
- **Error handling** — graceful degradation when localStorage unavailable (FR57) and friendly-voice error on JSON load failure (FR58)
- **Voice consistency** — UI copy + 370 personality messages must sound like one product
- **Testability** — pure logic (scoring, picker state machine, streak transitions) + key UI components must be reachable from a DOM-environment test framework (NFR9)

## Starter Template Evaluation

### Primary Technology Domain

Frontend SPA (browser-only TypeScript), static deploy, no backend.

### Starter Options Considered

- **Vite + React + TS** (selected) — best-in-class libraries for the two highest-risk UI requirements (drag-drop, animations); most-documented TS testing stack
- **Vite + Svelte + TS** — smaller bundle + built-in transitions, but weaker drag-drop ecosystem
- **Vite + Vanilla TS** — zero overhead, but every component pattern hand-rolled
- **Next.js / SvelteKit / Astro** — rejected as overkill for a 3-screen SPA with no routing, no SSR/SSG, no API routes

### Selected Starter: Vite + React + TypeScript

**Rationale:**
- dnd-kit (React-native, touch+mouse+pointer+keyboard sensors, ~10kb) directly mitigates the PRD's biggest UI risk
- Motion (the renamed Framer Motion, v12+) gives a production-grade animation system for fades, shake, count-up
- Vitest + React Testing Library + JSDOM is the most established TS-first DOM-environment testing stack — direct fit for NFR9
- React's component + hooks pattern is the most AI-friendly (predictable for agent implementation)
- AWS Amplify has first-class Vite support; static `dist/` output is trivially deployable

**Initialization Command:**

```bash
npm create vite@latest skilldares-app -- --template react-ts
```

Note: the first implementation story should handle merging the scaffold into this existing repo (the current `index.html` landing page will be replaced).

**Architectural Decisions Provided by Starter:**

- **Language & Runtime:** TypeScript (strict mode), React (latest with hooks)
- **Build Tooling:** Vite (HMR dev server on :5173, static `dist/` output)
- **Linting:** ESLint (basic Vite config)

**Decisions Still Open (covered in Step 4):**

- Drag-and-drop library: **dnd-kit** (recommended)
- Animation library: **Motion / motion/react** (recommended)
- Testing stack: **Vitest + React Testing Library + JSDOM** (recommended)
- CSS strategy: plain CSS / CSS modules / Tailwind (TBD)
- State management: in-component / Context (no external store likely needed)
- AWS Amplify config: `amplify.yml` content

This starter command should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):** state management approach, content loading + validation, drag-drop library, animation library, test stack.

**Important Decisions (Shape Architecture):** game state shape, picker logic isolation, CSS strategy, error handling.

**Deferred Decisions (Post-MVP):** pre-commit hooks, custom domain, preview-branch deploys, Sentry/observability.

### N/A Categories

- **Authentication & Security:** No auth required (NFR6). No PII collected. No user-provided HTML to render (low XSS surface).
- **API & Communication:** No backend; no runtime HTTP requests (NFR2). All content in-bundle.
- **Database:** No DB. JSON content files + `localStorage` for one number (high score).
- **Routing:** Three screens (Start, Playing, End) driven by a discriminated-union `Screen` state, not URLs.

### Frontend Architecture

- **State management:** React Context for game state; pure reducer (`gameReducer`) for transitions. No external store library.
- **Game state shape:** `Screen` discriminated union, current round (1–30), score, signed streak, hint-used-this-round flag, answered-rounds array.
- **Picker logic (FR38):** Pure module `src/lib/picker.ts`. Pure → unit-testable in isolation per NFR9.
- **Scoring + streak logic:** Separate pure modules (`src/lib/scoring.ts`, `src/lib/streak.ts`).
- **CSS:** Plain CSS + CSS Modules. Scoped class names without a build-time CSS-in-JS dependency.
- **Animation:** **Motion** (v12+, `motion/react`). `AnimatePresence` for screen transitions; `motion.div` with `initial`/`animate`/`exit` for fades, shake, count-up.
- **Drag-and-drop:** **@dnd-kit/core** + **@dnd-kit/sortable** (latest). `SortableContext` + `useSortable` for Type A questions; built-in touch + mouse + keyboard sensors.
- **Content loading:** Static JSON imports validated at runtime with **Zod 4.4.x** schemas. Schemas in `src/lib/schemas/` define both TS types (via `z.infer<>`) and runtime validators.

### Quality & Tooling

- **Test runner:** Vitest (latest).
- **Component testing:** React Testing Library + `@testing-library/user-event`.
- **DOM environment:** JSDOM (Vitest default).
- **Lint:** ESLint (from Vite starter) + `@typescript-eslint`.
- **Format:** Prettier with defaults.
- **Pre-commit hooks:** None in v1. Can revisit.

### Infrastructure & Deployment

- **Hosting:** AWS Amplify.
- **Build config (`amplify.yml`):** Two phases — `preBuild` runs `npm ci`, `build` runs `npm run build`. Artifact baseDirectory: `dist`. Cache: `node_modules/**/*`.
- **Branch strategy:** `main` → production. No preview branches in v1.
- **Environment variables:** None required.
- **Custom domain:** Use Amplify-provided HTTPS URL initially. Custom domain deferred.

### Cross-Cutting

- **Error handling (FR58):** Top-level React error boundary catches schema-validation errors and any uncaught render errors, displays a friendly error screen in the personality voice.
- **localStorage wrapper (FR57):** `src/lib/storage.ts` with try/catch around `getItem`/`setItem`. `hasStorage()` helper used by UI to conditionally render high-score-related elements.
- **Content validation strategy:** Build-time = a small validation script run pre-build (acts as a sanity gate before Amplify ever sees bad content). Runtime = Zod parse on initial load (safety net + powers the friendly error path).
- **Voice consistency:** All UI strings (button labels, "Next"/"Finish", error copy) authored in the same voice as the 370 message pools. Consolidated in a single `src/content/ui-strings.ts` for editorial coherence.

### Decision Impact Analysis

**Implementation Sequence (first stories):**

1. Scaffold the Vite + React + TS project into this repo (replacing current `index.html`)
2. Add core dependencies: motion, @dnd-kit/core, @dnd-kit/sortable, zod, vitest, @testing-library/react, @testing-library/user-event
3. Set up `amplify.yml` and verify a clean deploy of the empty scaffold to AWS
4. Define Zod schemas for all content types
5. Build the `gameReducer` + `picker` + `scoring` + `streak` modules with unit tests before any UI

**Cross-Component Dependencies:**

- Game state is owned by a top-level Context provider; question components consume it via hooks
- Picker module is consumed by the reducer after every answer event
- Drag-and-drop state lives inside the Type A component (local), only the final ordered list reaches the reducer on submit
- Animation hooks (`AnimatePresence`) wrap screen-level components for fade transitions

## Implementation Patterns & Consistency Rules

These rules exist to prevent conflicts between AI agents implementing different parts of the codebase. Where two reasonable choices exist, the chosen one is the rule.

### Naming Conventions

**Files:**
- Component files: `PascalCase.tsx` (e.g., `QuestionMC.tsx`, `StartScreen.tsx`)
- Non-component TS files: `camelCase.ts` (e.g., `gameReducer.ts`, `picker.ts`, `storage.ts`)
- Test files: same basename + `.test.ts` or `.test.tsx`, co-located with source
- Schema files: `camelCase.schema.ts` (e.g., `question.schema.ts`)
- CSS Modules: `ComponentName.module.css`
- Content files: `kebab-case` for JSON data (e.g., `multiple-choice.json`); `camelCase.ts` for code-resident content (e.g., `uiStrings.ts`)

**Code:**
- Components: `PascalCase` (e.g., `function QuestionMC()`)
- Variables, functions, hooks: `camelCase`
- Hooks always prefixed `use*` (e.g., `useGameState`, `useHighScore`)
- Types and Zod schemas: `PascalCase` (e.g., `GameState`, `QuestionSchema`)
- Top-level constants: `SCREAMING_SNAKE_CASE` (e.g., `ROUNDS_PER_GAME = 30`)
- Booleans: prefixed `is*`, `has*`, `can*`, `should*` (e.g., `isCorrect`, `hasStreak`, `shouldShowHint`)
- CSS Module class names: `camelCase` (e.g., `styles.questionCard`, `styles.timerLow`)

**Types vs Interfaces:**
- Use `type` always. Reserved exception: declaration merging (not expected in this codebase).

**JSON content:**
- Field names: `camelCase` (matches TS types directly; no transformation layer needed).

### File Organization

```
src/
  components/           # React components, organized by screen/role
    start/
      StartScreen.tsx
      StartScreen.module.css
      StartScreen.test.tsx
    game/
      GameScreen.tsx
      QuestionMC.tsx
      QuestionMC.test.tsx
      QuestionOrder.tsx       # Speed Type A
      QuestionOrder.test.tsx
      QuestionSelect.tsx      # Speed Type B
      QuestionSelect.test.tsx
      ScoreDisplay.tsx
      TimerDisplay.tsx
      HintButton.tsx
      FeedbackOverlay.tsx
    end/
      EndScreen.tsx
      EndScreen.test.tsx
    shared/
      Button.tsx
      ItemSquare.tsx
  lib/                  # Pure logic, framework-free
    gameReducer.ts
    gameReducer.test.ts
    picker.ts
    picker.test.ts
    scoring.ts
    scoring.test.ts
    streak.ts
    streak.test.ts
    storage.ts
    storage.test.ts
    schemas/
      question.schema.ts
      message.schema.ts
  state/                # React Context provider, hooks
    GameProvider.tsx
    useGameState.ts
  content/              # In-code content
    uiStrings.ts        # All button labels, error copy, etc. — same voice as message pools
  styles/               # Global CSS (resets, base typography)
    global.css
  main.tsx              # Vite entry
  App.tsx               # Top-level error boundary + screen switching

data/
  questions/
    multiple-choice.json
    speed-order.json
    speed-select.json
  messages/
    pre-game-encouragement.json
    right-no-streak.json
    wrong-no-streak.json
    on-fire.json
    doing-bad.json
    streak-broken.json
    comeback.json
    new-high-score.json
```

**Rules:**
- Tests are **co-located** with source, never in a separate `__tests__/` folder. Easier to keep tests near the code they exercise.
- Components are organized **by screen/role**, not by type (no `containers/` / `presentational/` split).
- Pure logic (no React, no DOM) lives in `src/lib/` and is the priority test target for NFR9.
- Schemas live in `src/lib/schemas/` and are imported by both the loader and the test suite.

### State & Reducer Patterns

- **Actions:** discriminated-union types, not string constants. Example:

  ```typescript
  type Action =
    | { type: 'START_GAME' }
    | { type: 'ANSWER_QUESTION'; payload: { answer: Answer; usedHint: boolean } }
    | { type: 'USE_HINT' }
    | { type: 'ADVANCE_TO_NEXT' }
    | { type: 'FINISH_GAME' }
    | { type: 'PLAY_AGAIN' };
  ```

- **Reducer:** pure, no side effects. All randomness (question selection, message picking) injected as parameters so tests can be deterministic.
- **State updates:** immutable. Use spread or `structuredClone` for nested updates. No mutation of `state` arguments.
- **Side effects (timer, localStorage):** handled in `useEffect` / dedicated hooks, not in the reducer.
- **Hook return shape:** `useGameState()` returns `{ state, dispatch, helpers }`. Helpers are convenience wrappers around dispatch so components don't construct action objects.

### Content Loading Pattern

- Import each JSON file directly at module scope:
  ```typescript
  import rawQuestions from '../../data/questions/multiple-choice.json';
  ```
- Validate immediately at module load using the corresponding Zod schema:
  ```typescript
  const questions = MultipleChoicePoolSchema.parse(rawQuestions);
  ```
- Validation failure throws. The top-level error boundary catches the throw and renders the FR58 friendly error screen.
- Question/message types are **always** derived via `z.infer<typeof Schema>` — never hand-written separately. Single source of truth.

### Animation Pattern

- Screen transitions: wrap top-level screens in `<AnimatePresence>` with `mode="wait"`. Use `initial`/`animate`/`exit` props.
- Component-level animations: use `motion.div` with semantic prop bundles (e.g., a shared `fadeInUp` variants object).
- Shake-on-low-timer: dedicated `motion.div` with `animate={isLow ? 'shake' : 'still'}` referencing variants.
- All variant objects live in `src/lib/motionVariants.ts` (single source of motion language; prevents drift across components).

### Drag-and-Drop Pattern

- Type A (Order) wraps items in `SortableContext` with `useSortable` hooks.
- DnD state is **local to the question component** (`useState` of the ordered array). Only the final submitted order reaches the reducer via `ANSWER_QUESTION`.
- All sensors enabled: `PointerSensor`, `TouchSensor`, `KeyboardSensor`.

### Test Patterns

- BDD-style: `describe('module', () => { it('does the thing', () => {}) })`.
- Pure modules in `src/lib/`: 100% behavior coverage. Inject randomness, time, and storage.
- Component tests use `@testing-library/user-event` for interactions; no `fireEvent` unless `userEvent` doesn't support the gesture.
- Tests **never** import the real JSON content files — they use minimal fixtures inline or in `src/__fixtures__/`. Avoids brittleness when content changes.

### Error Handling Patterns

- Top-level `<ErrorBoundary>` in `App.tsx` catches any uncaught render error or content-validation throw. Renders `<ErrorScreen />` with friendly voice copy from `uiStrings.ts`.
- `storage.ts` swallows all `localStorage` errors and exposes `hasStorage()` so UI can conditionally hide high-score features (FR57).
- No global try/catch wrappers elsewhere — let errors surface to the boundary.

### What Agents MUST Do

- Use the file structure above; do NOT introduce new top-level folders without updating this document
- Use `type` declarations (not `interface`)
- Co-locate tests with source
- Derive content types from Zod schemas via `z.infer<>`
- Use discriminated-union actions (not string constants)
- Make pure logic pure (no React, no DOM, no I/O) — period
- Use `userEvent` not `fireEvent` in component tests

### Anti-Patterns to Avoid

- Putting side effects in the reducer (timers, localStorage, dispatching from within reducer)
- Reading from `data/` JSON in tests (use fixtures)
- Hand-writing TypeScript types that mirror Zod schemas (single source of truth via `z.infer<>`)
- Inline animation values scattered across components (use the shared variants module)
- Mixing camelCase and snake_case in JSON content
- Creating a `containers/` folder, a `presentational/` folder, or any kind of HOC-era pattern

## Project Structure & Boundaries

### Complete Project Directory Structure

```
skilldares/
├── README.md
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts                  # Vite + Vitest config (Vitest is Vite-native)
├── eslint.config.js
├── .prettierrc
├── .gitignore
├── amplify.yml                     # AWS Amplify build config
├── index.html                      # Vite entry HTML (REPLACES current landing page)
├── public/
│   └── (favicon, optional static assets)
├── src/
│   ├── main.tsx                    # Vite entry; mounts <App />
│   ├── App.tsx                     # Top-level error boundary + screen switcher
│   ├── App.test.tsx
│   ├── components/
│   │   ├── start/
│   │   │   ├── StartScreen.tsx
│   │   │   ├── StartScreen.module.css
│   │   │   └── StartScreen.test.tsx
│   │   ├── game/
│   │   │   ├── GameScreen.tsx                # Orchestrates current round + sub-views
│   │   │   ├── GameScreen.module.css
│   │   │   ├── GameScreen.test.tsx
│   │   │   ├── QuestionMC.tsx                # F2
│   │   │   ├── QuestionMC.module.css
│   │   │   ├── QuestionMC.test.tsx
│   │   │   ├── QuestionOrder.tsx             # F3 — dnd-kit Sortable
│   │   │   ├── QuestionOrder.module.css
│   │   │   ├── QuestionOrder.test.tsx
│   │   │   ├── QuestionSelect.tsx            # F4 — multi-select
│   │   │   ├── QuestionSelect.module.css
│   │   │   ├── QuestionSelect.test.tsx
│   │   │   ├── ScoreDisplay.tsx              # F6 — count-up animated
│   │   │   ├── ScoreDisplay.module.css
│   │   │   ├── ScoreDisplay.test.tsx
│   │   │   ├── TimerDisplay.tsx              # F10 — shake at low
│   │   │   ├── TimerDisplay.module.css
│   │   │   ├── TimerDisplay.test.tsx
│   │   │   ├── HintButton.tsx                # F5
│   │   │   ├── HintButton.module.css
│   │   │   ├── HintButton.test.tsx
│   │   │   ├── FeedbackOverlay.tsx           # F7 — shows correct/wrong + message
│   │   │   ├── FeedbackOverlay.module.css
│   │   │   └── FeedbackOverlay.test.tsx
│   │   ├── end/
│   │   │   ├── EndScreen.tsx
│   │   │   ├── EndScreen.module.css
│   │   │   └── EndScreen.test.tsx
│   │   └── shared/
│   │       ├── Button.tsx
│   │       ├── Button.module.css
│   │       ├── Button.test.tsx
│   │       ├── ItemSquare.tsx                # Reused in QuestionOrder + QuestionSelect
│   │       ├── ItemSquare.module.css
│   │       ├── ErrorScreen.tsx               # F12
│   │       └── ErrorScreen.test.tsx
│   ├── lib/                                  # Pure logic, no React, no DOM
│   │   ├── gameReducer.ts
│   │   ├── gameReducer.test.ts
│   │   ├── picker.ts                         # FR38 picker logic
│   │   ├── picker.test.ts
│   │   ├── scoring.ts                        # FR30–FR34
│   │   ├── scoring.test.ts
│   │   ├── streak.ts                         # FR4 streak transitions
│   │   ├── streak.test.ts
│   │   ├── storage.ts                        # FR57 localStorage wrapper
│   │   ├── storage.test.ts
│   │   ├── motionVariants.ts                 # All Motion variants centralized
│   │   ├── questionSelection.ts              # FR6 random draw of 30 from pool
│   │   ├── questionSelection.test.ts
│   │   └── schemas/
│   │       ├── question.schema.ts            # Zod schemas + z.infer<> types
│   │       ├── question.schema.test.ts
│   │       ├── message.schema.ts
│   │       └── message.schema.test.ts
│   ├── state/                                # React Context + hooks
│   │   ├── GameProvider.tsx                  # Wraps useReducer(gameReducer)
│   │   ├── GameProvider.test.tsx
│   │   ├── useGameState.ts                   # Hook: returns { state, dispatch, helpers }
│   │   ├── useHighScore.ts                   # FR47 read/write personal best
│   │   └── useTimer.ts                       # FR15/FR17 countdown effect
│   ├── content/
│   │   └── uiStrings.ts                      # All button labels, error copy — single voice source
│   ├── styles/
│   │   └── global.css                        # Resets, base typography
│   ├── types/
│   │   └── menu.ts                           # Optional shared menu item key types
│   └── __fixtures__/
│       ├── questions.fixture.ts              # Minimal fixtures for tests
│       └── messages.fixture.ts
├── data/
│   ├── menu_front.md                         # Source-of-truth menu (existing)
│   ├── menu_back.md                          # Source-of-truth menu (existing)
│   ├── questions/
│   │   ├── multiple-choice.json              # ≥200 MC questions
│   │   ├── speed-order.json                  # 40 Type A questions
│   │   └── speed-select.json                 # 40 Type B questions
│   └── messages/
│       ├── pre-game-encouragement.json       # 50
│       ├── right-no-streak.json              # 50
│       ├── wrong-no-streak.json              # 50
│       ├── on-fire.json                      # 50
│       ├── doing-bad.json                    # 50
│       ├── streak-broken.json                # 50
│       ├── comeback.json                     # 50
│       └── new-high-score.json               # ~20
├── scripts/
│   └── validate-content.ts                   # Build-time content validation against Zod schemas
└── _bmad-output/                             # BMad workflow outputs (existing)
```

### Architectural Boundaries

- **Pure logic ↔ React boundary:** `src/lib/` and `src/lib/schemas/` contain ZERO React imports, ZERO DOM access, ZERO I/O. They take state and inputs, return state and outputs. Test target #1 for NFR9.
- **Reducer ↔ Provider boundary:** `gameReducer` is called by `GameProvider`'s `useReducer`. Nothing else.
- **Provider ↔ Components boundary:** Components access game state only through hooks (`useGameState`, `useHighScore`, `useTimer`). No direct Context access.
- **Component ↔ Component boundary:** Props down, callbacks up. No event bus, no global pub/sub.
- **Content JSON ↔ Components boundary:** JSON files are imported at module scope. Schemas validate at import time. Components never see unvalidated JSON.
- **localStorage ↔ App boundary:** Only `src/lib/storage.ts` touches `localStorage`. Hooks consume it; UI never calls `localStorage` directly.
- **Reducer ↔ Picker boundary:** The reducer calls `picker.pickPool(state)` after answer transitions. Picker is pure; message-selection randomness is injected via an `Rng` parameter so tests can be deterministic.

### Requirements → File Mapping

| FR group | Primary location |
| --- | --- |
| **F1 Game Loop & State** (FR1–FR7) | `src/lib/gameReducer.ts`, `src/state/GameProvider.tsx`, `src/lib/questionSelection.ts` |
| **F2 MC Round** (FR8–FR11) | `src/components/game/QuestionMC.tsx` |
| **F3 Speed Type A** (FR12–FR18) | `src/components/game/QuestionOrder.tsx` (dnd-kit `SortableContext`) |
| **F4 Speed Type B** (FR19–FR24) | `src/components/game/QuestionSelect.tsx` |
| **F5 Hint** (FR25–FR29) | `src/components/game/HintButton.tsx` + `gameReducer` `USE_HINT` action |
| **F6 Scoring** (FR30–FR35) | `src/lib/scoring.ts`, `src/components/game/ScoreDisplay.tsx` (count-up animation) |
| **F7 Personality / Messages** (FR36–FR41) | `src/lib/picker.ts`, `src/components/game/FeedbackOverlay.tsx`, `data/messages/*.json` |
| **F8 Start Screen** (FR42–FR44) | `src/components/start/StartScreen.tsx` |
| **F9 End Screen** (FR45–FR48) | `src/components/end/EndScreen.tsx`, `src/state/useHighScore.ts` |
| **F10 Animation & Motion** (FR49–FR52) | `src/lib/motionVariants.ts`, applied across all screens + question components |
| **F11 Content Loading** (FR53–FR56) | `src/lib/schemas/*.schema.ts`, `scripts/validate-content.ts`, JSON imports in components/providers |
| **F12 Error Handling** (FR57–FR58) | `src/App.tsx` (ErrorBoundary), `src/components/shared/ErrorScreen.tsx`, `src/lib/storage.ts` |

| NFR | Where addressed |
| --- | --- |
| **NFR1–2** Static, no APIs | Architectural — no `fetch` / `XHR` code anywhere |
| **NFR3** Browser support | `vite.config.ts` `build.target` set to modern (e.g., `es2022`) |
| **NFR4** Responsive | `src/styles/global.css` + per-component CSS Modules with media queries |
| **NFR5** TypeScript | `tsconfig.json` strict mode, `"strict": true` |
| **NFR6** No auth | Nothing to build |
| **NFR7** Performance | Vite production build, Motion's hardware-accelerated Web Animations API |
| **NFR8** Persistence | `src/lib/storage.ts` (only file touching localStorage) |
| **NFR9** Automated tests | `*.test.ts` / `*.test.tsx` co-located with every load-bearing module + component |

### Data Flow

1. **App boots:** `main.tsx` renders `<App />`.
2. **Content import:** `App.tsx` (or a content-loader module it imports) imports JSON files, runs Zod `parse()`. Failure throws → ErrorBoundary catches → renders `<ErrorScreen />`.
3. **State init:** `<GameProvider>` wraps the screen switcher; initializes `useReducer(gameReducer, initialState)`.
4. **Screen routing:** `App.tsx` reads `state.screen` and renders one of `<StartScreen>`, `<GameScreen>`, `<EndScreen>` wrapped in `<AnimatePresence>`.
5. **Answer event:** A question component dispatches `ANSWER_QUESTION` with the user's answer + `usedHint` flag. The reducer:
   - Computes correctness using `scoring.ts`
   - Computes new streak using `streak.ts`
   - Picks a message pool using `picker.pickPool(state, prevStreak)` and selects a message via injected RNG
   - Returns new state including `currentFeedback: { isCorrect, message, pointsAwarded }`
6. **Feedback display:** `FeedbackOverlay` reads `state.currentFeedback`, shows correct/wrong + message, reveals Next/Finish button.
7. **Advance:** User taps Next → dispatch `ADVANCE_TO_NEXT` → reducer clears feedback, increments round, presents next question. On round 30, button reads Finish → dispatch `FINISH_GAME` → state transitions to End screen.
8. **End screen:** Reads `state.score` + `useHighScore()` (which reads localStorage). If new score > previous best, writes new high score + picks a `new-high-score` message. Play Again → `PLAY_AGAIN` → reducer resets state + draws fresh 30 questions.

### Build & Deploy

- **Local dev:** `npm run dev` → Vite dev server on http://localhost:5173 with HMR
- **Production build:** `npm run build` → TypeScript type-check → Vite outputs static bundle to `dist/`
- **Pre-build validation:** `prebuild` script in `package.json` invokes `scripts/validate-content.ts`, which loads every JSON in `data/` and runs Zod `parse` on each. Non-zero exit blocks the build. Protects the Amplify pipeline from ever shipping malformed content.
- **AWS Amplify build:** Triggered on push to `main`. Reads `amplify.yml`. Phases: `preBuild` → `npm ci`; `build` → `npm run build` (which includes content validation via `prebuild`). Artifact: `dist/`. Cached: `node_modules/`.
- **Tests:** `npm test` → Vitest runs all `*.test.ts(x)` using JSDOM. Optional `test:ci` script with `--coverage` for visibility; no formal coverage % gate is enforced per NFR9.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:** Vite + React + TypeScript + Motion (`motion/react`) + @dnd-kit + Zod + Vitest + React Testing Library — all current versions, all compatible. No conflicts identified.

**Pattern Consistency:** Naming conventions, discriminated-union actions, immutable reducer, co-located tests, Zod-derived types — all align with React/TypeScript ecosystem norms.

**Structure Alignment:** `src/`, `public/`, `dist/` is the Vite-expected layout. Component organization by screen/role works naturally with state-based screen switching.

### Requirements Coverage Validation ✅

**Functional Requirements (58 FRs across 12 groups):** Every group mapped to specific files/components — see the Requirements → File Mapping table above.

**Non-Functional Requirements (9 NFRs):** Every NFR mapped to a specific architectural mechanism — see the NFR table above.

### Implementation Readiness Validation ✅

**Decision Completeness:** All critical decisions documented with library names + current versions verified via web search.

**Structure Completeness:** Full tree is concrete (no placeholders); every file has a defined location.

**Pattern Completeness:** Patterns are specific enough for an AI agent to follow without guessing — discriminated unions named, hook return shapes specified, anti-patterns enumerated.

### Gap Analysis Results

**Critical Gaps:** None.

**Important Gaps (not blocking; resolve at story authoring):**

- Exact "timer running low" threshold for FR50 shake — likely 5s or 3s; component decides visual treatment based on `useTimer`'s `secondsRemaining`
- Deterministic algorithm for the "approximately 50/50" Type A vs Type B speed-round split (FR3) in `questionSelection.ts` — likely alternation or weighted random
- Formal signature of the picker's `Rng` injection — to be specified in the gameReducer story

**Nice-to-Have Gaps:**

- Per-module README sections (not required; architecture doc covers responsibilities)
- FR-ID → test-name glossary (could be derived from test names; not required)

### Architecture Completeness Checklist

**Requirements Analysis**

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed (low-to-medium, frontend SPA)
- [x] Technical constraints identified (TS, static, no APIs, Amplify)
- [x] Cross-cutting concerns mapped (drag-drop, motion, validation, error handling, voice, testability)

**Architectural Decisions**

- [x] Critical decisions documented with versions (React 19, Vite latest, Motion v12+, dnd-kit latest, Zod 4.4.3, Vitest latest)
- [x] Technology stack fully specified
- [x] Integration patterns defined (Provider/hooks, schemas, ErrorBoundary)
- [x] Performance considerations addressed (Vite build, Motion hardware-accel)

**Implementation Patterns**

- [x] Naming conventions established
- [x] Structure patterns defined (by-screen folders, lib for pure logic, co-located tests)
- [x] Communication patterns specified (props-down/callbacks-up, no event bus)
- [x] Process patterns documented (error handling via boundary, content validation via Zod, storage wrapping)

**Project Structure**

- [x] Complete directory structure defined (full tree, every file)
- [x] Component boundaries established (pure logic ↔ React, Provider ↔ hooks ↔ components)
- [x] Integration points mapped (data flow walked end-to-end)
- [x] Requirements to structure mapping complete (FR & NFR tables)

### Architecture Readiness Assessment

**Overall Status:** **READY FOR IMPLEMENTATION** — all 16 checklist items checked; no critical gaps open.

**Confidence Level:** High. Small product surface, mainstream tech choices, cross-cutting concerns explicitly addressed.

**Key Strengths:**

- Strong separation between pure logic and React (enables high-confidence unit testing per NFR9)
- Centralized motion variants prevent animation drift across components
- Zod-derived types eliminate hand-written-type drift from schemas
- Build-time content validation catches bad JSON before deploy

**Areas for Future Enhancement (post-v1):**

- Add E2E tests (Playwright) once the surface is stable
- Add pre-commit hooks (husky + lint-staged)
- Add preview-branch deploys via AWS Amplify
- Consider extracting `motionVariants.ts` and `uiStrings.ts` into themed packages if the project ever forks to other restaurants

### Implementation Handoff

**AI Agent Guidelines:**

- Follow all architectural decisions exactly as documented in this file
- Use implementation patterns consistently — file naming, action shape, type vs interface, hook return shape
- Respect the boundaries: `src/lib/` stays pure; `src/components/` consumes state only via hooks; `localStorage` only via `storage.ts`
- Derive types from Zod schemas via `z.infer<>` — never hand-write parallel types
- Refer to this document for all architectural questions; raise blockers when patterns are silent

**First Implementation Priority:**

```bash
npm create vite@latest skilldares-app -- --template react-ts
```

(Then merge scaffold into this repo, replacing the current `index.html`.)
