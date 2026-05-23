---
title: "Skilldares — Product Requirements Document"
status: final
created: 2026-05-23
updated: 2026-05-23 (post-finalize override — content quality bar raised, see decision log)
---

# Skilldares — Product Requirements Document

## 1. Overview

Skilldares is a static, browser-based quiz game that helps new servers at Kildares pub memorize the menu. Each play is a 30-round game — 15 multiple-choice questions followed by 15 speed-based questions — with a single running score and a sharp, irreverent voice that praises or insults the player based on how they're doing.

This PRD specifies the v1 build. It carries forward all decisions from `brief-skilldares-2026-05-23/brief.md` and its decision log, and resolves the gaps that remained at brief stage. See the PRD's own `.decision-log.md` for the gap-resolution record.

## 2. Users & Context

**Primary user:** A new server in their first week at Kildares pub. They need to memorize the menu — items, ingredients, prices, allergens, beer ABVs — well enough to recommend dishes, answer guest questions, and avoid pointing the GF guest at the gluten burger.

**Use context:** The server uses the app on their own phone or a personal laptop during downtime — between shifts, on a bus ride, lying on the couch. Sessions are short (one full game = 30 questions = approximately 5-8 minutes). The app is meant to feel more like a snackable game than a training course.

**Single-user assumption:** The app assumes each player uses their own device. Shared-device usage is not designed for in v1 (the localStorage high score becomes meaningless under sharing).

## 3. User Journey

### UJ-1 — First Play

1. The server opens the Skilldares URL on their phone in a browser.
2. They see a Start screen: a Start Game button and a randomly-selected pre-game message in the game's voice (e.g., *"Let's not be a dumbass, let's learn the menu"*).
3. They tap Start Game. Round 1 begins.
4. Rounds 1–15: a multiple-choice question with four options. They may tap a Hint button to grey out one wrong answer (this is optional and costs them points if they take it). After answering, they see correct/incorrect feedback plus a personality message, then tap Next.
5. Rounds 16–30: a speed-based question with a 15-second timer ticking down visibly. The question is either drag-to-order (Type A) or multi-select-criteria (Type B). As the timer approaches zero, on-screen elements shake. They submit, see feedback, tap Next (or Finish on round 30).
6. End screen: their final score, their personal best, and — if they beat the previous best — a celebratory message from the `new-high-score` pool. A Play Again button restarts a fresh 30-round game.

## 4. Functional Requirements

Features are grouped by concern. FR IDs are globally numbered and stable.

### F1 — Game Loop & State Management

- **FR1** The app SHALL present exactly 30 rounds per game.
- **FR2** Rounds 1 through 15 SHALL be multiple-choice (see F2). Rounds 16 through 30 SHALL be speed-based (see F3, F4).
- **FR3** Within the 15 speed rounds, the app SHALL split the question types approximately 50/50 between Type A (drag-order) and Type B (multi-select). The exact split per game MAY vary by ±1 depending on the random draw, but the overall pool target is half-and-half.
- **FR4** The app SHALL maintain in-memory game state: current round number (1–30), current score, current streak (signed integer where positive = correct streak, negative = wrong streak, zero = no active streak), and a hint-used flag for the current question.
- **FR5** Game state SHALL NOT be persisted across browser sessions or refreshes. A refresh mid-game SHALL discard progress and return the user to the Start screen.
- **FR6** Question selection per game SHALL be uniform-random from the available pools, subject to the round-structure constraints in FR2 and FR3. Repeats across plays are permitted.
- **FR7** A running score SHALL be displayed in the upper-right of the gameplay UI at all times during play.

### F2 — Multiple-Choice Round (Rounds 1–15)

- **FR8** Each MC question SHALL present a question prompt and exactly four answer options.
- **FR9** Of the four options, exactly one SHALL be correct, exactly one SHALL be obviously-wrong-and-funny (e.g., "Rat Feces" in an ingredient list), and exactly two SHALL be close-distractors (plausible wrong answers from adjacent menu items or attributes).
- **FR10** Question shapes SHALL include at minimum: ingredient listing ("Which ingredients come in the House Salad?"), pricing ("How much does the Street Corn Bowl cost?"), and attribute/category ("Which of the following is Gluten Free?"). The authoring brief encourages additional creative shapes.
- **FR11** Selecting an option SHALL immediately lock the answer (no change after selection) and trigger the feedback flow (see F7).

### F3 — Speed Round Type A — Drag-to-Order

- **FR12** Each Type A question SHALL present 3–5 squares containing menu item names and a prompt asking the user to arrange them in correct order by a specified factor.
- **FR13** Permitted factors are limited to: **price** and **ABV** (ABV applies only to drinks where ABV is listed in the menu).
- **FR14** The user SHALL be able to drag and rearrange squares to set an order. The interaction SHALL work on both touch and mouse input devices.
- **FR15** A 15-second countdown timer SHALL be visible while the question is active.
- **FR16** A Submit button SHALL be visible. The user submits when ready.
- **FR17** If the timer reaches zero before submission, the question is scored as wrong.
- **FR18** On submission, each square SHALL reveal the factor value beneath it (e.g., the price or ABV), and the question SHALL be marked correct (exact order match) or wrong (any deviation).

### F4 — Speed Round Type B — Multi-Select Criteria

- **FR19** Each Type B question SHALL present 5 squares containing menu items and a prompt asking the user to select all squares matching a criteria.
- **FR20** Permitted criteria types are: (a) "items in [dish]" — components of a composite dish; (b) "items that are GF"; (c) "items in [menu section]" — items belonging to a named menu section.
- **FR21** The correct subset SHALL contain at least one item and MAY contain up to all five. The remaining squares SHALL be real menu items chosen as close-distractors (e.g., items from related dishes), not random text.
- **FR22** The user SHALL be able to select and deselect squares individually before submission. Selections SHALL be visually distinct from non-selected squares.
- **FR23** A Submit button SHALL be visible. A 15-second timer applies as in FR15 / FR17.
- **FR24** On submission, the app SHALL reveal which of the user's selected squares were correct and which were wrong. The question SHALL be scored correct only if the user's selection set exactly matches the correct set; any deviation (missing a correct item, including a wrong one) SHALL be scored as wrong.

### F5 — Hint Mechanic (MC Rounds Only)

- **FR25** A Hint button SHALL be visible on each multiple-choice question (rounds 1–15 only).
- **FR26** The Hint button SHALL NOT be visible on speed rounds.
- **FR27** Tapping Hint SHALL grey out one randomly-selected wrong answer option, leaving 3 visually-active options (1 correct + 2 wrong).
- **FR28** Hint SHALL be available once per question. Using the hint on one question does not affect hint availability on other questions.
- **FR29** Using the hint SHALL alter the scoring for that question only (see F6).

### F6 — Scoring

- **FR30** Correct answer (no hint used) SHALL award **5 points**.
- **FR31** Correct answer (hint used) SHALL award **2 points**.
- **FR32** Wrong answer SHALL award **0 points**. No negative scoring.
- **FR33** Timer expiry on a speed round SHALL be treated as a wrong answer (0 points).
- **FR34** Speed round Type A and Type B SHALL both be scored all-or-nothing (5 for exact match, 0 otherwise). The hint mechanic does not apply.
- **FR35** When points are awarded, the score display SHALL animate as a count-up from the previous value to the new value, with a slight bounce.

### F7 — Personality / Feedback Message System

- **FR36** After every answered (or timed-out) question, the app SHALL display correct/incorrect feedback together with a single personality message drawn from a pool selected by the picker logic (FR38).
- **FR37** The app SHALL maintain 8 pre-authored message pools:

| Pool ID | Trigger | Pool size |
| --- | --- | --- |
| `pre-game-encouragement` | Start screen, before round 1 | 50 |
| `right-no-streak` | Correct answer, no active streak (or breaking into a streak below the 3-mark) | 50 |
| `wrong-no-streak` | Wrong answer, no active streak | 50 |
| `on-fire` | Correct answer at or beyond a 3-correct streak | 50 |
| `doing-bad` | Wrong answer at or beyond a 3-wrong streak | 50 |
| `streak-broken` | Wrong answer that ends a 3+ correct streak | 50 |
| `comeback` | Correct answer that ends a 3+ wrong streak | 50 |
| `new-high-score` | End-of-game, current score beat the stored personal best | ~20 |

Total authored messages: **370**.

- **FR38** Per-answer picker logic SHALL be:

  **On correct answer:**
  - If the streak immediately before this answer was ≤ −3 → pool = `comeback`; new streak = 1.
  - Else if the new streak (after this answer, = previous + 1 capped at floor 1) ≥ 3 → pool = `on-fire`; update streak.
  - Else → pool = `right-no-streak`; update streak.

  **On wrong answer (including timer expiry):**
  - If the streak immediately before this answer was ≥ 3 → pool = `streak-broken`; new streak = −1.
  - Else if the new streak (after this answer, = previous − 1 capped at ceiling −1) ≤ −3 → pool = `doing-bad`; update streak.
  - Else → pool = `wrong-no-streak`; update streak.

- **FR39** Within a chosen pool, the displayed message SHALL be selected uniform-random. The app MAY (but is not required to) avoid repeating the most-recently-shown message from the same pool within a single game.
- **FR40** Streak state SHALL be reset to 0 at the start of every game (including Play Again).
- **FR41** Message voice SHALL be irreverent, willing to be harsh, willing to be profane, willing to praise hard. Voice consistency across pools is a content requirement (see Section 6).

### F8 — Start Screen

- **FR42** The Start screen SHALL display: the app name/title, a Start Game button, and one randomly-selected message from the `pre-game-encouragement` pool.
- **FR43** No instructional text, rules summary, or onboarding tutorial SHALL be shown. The mechanics are intentionally discoverable through play.
- **FR44** Tapping Start Game SHALL transition to round 1.

### F9 — End Screen

- **FR45** After round 30 is answered and the Finish button is tapped, the app SHALL transition to the End screen.
- **FR46** The End screen SHALL display: the player's final score, the player's personal best score (read from localStorage, or "—" if none stored), and a Play Again button.
- **FR47** If the current final score is strictly greater than the stored personal best (or if no personal best was previously stored), the End screen SHALL also display a celebratory message drawn uniform-random from the `new-high-score` pool, AND SHALL update the stored personal best in localStorage to the new value.
- **FR48** Tapping Play Again SHALL begin a fresh 30-round game with new randomly-drawn questions, score reset to 0, streak reset to 0, and hint-used flags reset.

### F10 — Animation & Motion

- **FR49** Transitions between screens (Start → gameplay, question → feedback → next question, game → End) SHALL use fade in/out animations.
- **FR50** During speed rounds, when the countdown timer reaches its final seconds (approximately 5 seconds remaining or less), on-screen elements SHALL shake/vibrate to telegraph urgency.
- **FR51** The score-display count-up animation (FR35) SHALL trigger when points are awarded.
- **FR52** All animations SHALL be implemented in a way that does not block user interaction or significantly degrade performance on mid-tier mobile devices.

### F11 — Content Loading

- **FR53** Question content (multiple-choice, speed Type A, speed Type B) SHALL be loaded from JSON files committed to the repository at `data/questions/`.
- **FR54** Message-pool content (all 8 pools) SHALL be loaded from JSON files committed to the repository.
- **FR55** Each question SHALL include a `menuRefs` field listing the keys/slugs of menu items it references. This field enables manual traceability when the menu changes; it is NOT used by runtime logic in v1.
- **FR56** Question content SHALL be validated against TypeScript type definitions at runtime (or build-time, depending on implementation choice). Malformed content SHALL trigger the error path in F12.

### F12 — Error Handling

- **FR57** If `localStorage` is unavailable (e.g., browser private-browsing mode), the game SHALL play normally, and the high-score features (display of personal best on End screen, `new-high-score` pool trigger, stored personal best update) SHALL silently degrade with no visible error.
- **FR58** If question JSON or message JSON fails to load or fails type validation at startup, the app SHALL display a friendly error screen in the game's personality voice (e.g., *"Something broke. Try refreshing."*). No partial game state shall be presented.

## 5. Non-Functional Requirements

- **NFR1 — Static deployment:** The app SHALL be deployable as a fully static bundle (HTML, CSS, JavaScript, JSON content) with no server-side runtime requirements.
- **NFR2 — No external runtime APIs:** The app SHALL NOT make any HTTP requests to external services during gameplay or content loading. All content lives in-bundle.
- **NFR3 — Browser support:** The app SHALL function correctly on the latest two versions of Safari and Chrome on both desktop and mobile.
- **NFR4 — Responsive layout:** The app SHALL render and function correctly across viewport widths from 320px (small mobile) to 1920px (desktop). Touch interactions and pointer interactions SHALL both be supported for the drag-to-order Type A question.
- **NFR5 — TypeScript:** Source code SHALL be written in TypeScript. The runtime artifact MAY be compiled JavaScript.
- **NFR6 — No authentication:** The app SHALL NOT require accounts, login, or any form of user identification.
- **NFR7 — Performance:** A full game (30 rounds) SHALL be playable without perceptible lag on a representative mid-tier 2-year-old smartphone. Initial app load SHALL be under 3 seconds on a typical 4G connection.
- **NFR8 — Persistence:** The only persisted state SHALL be the personal-best high score, stored in `localStorage` per device.
- **NFR9 — Automated tests:** Source code SHALL include automated tests covering (a) pure logic — scoring rules (FR30–FR34), the message-picker state machine (FR38), streak transitions (FR4, FR40), and content validation (FR56); and (b) UI components — the multiple-choice question, both speed-round question types (drag-to-order and multi-select-criteria), the feedback flow, and the end screen. Tests SHALL be written in TypeScript using a DOM-environment test framework (e.g., Vitest or Jest with JSDOM, plus Testing Library). All load-bearing FRs in F1 through F7 SHALL have at least one corresponding test. No formal coverage percentage target is set. End-to-end browser-automation tests (Playwright, Cypress) are NOT required for v1.

## 6. Content Authoring Pipeline

The 80 speed-round questions, ≥200 multiple-choice questions, and 370 personality messages are generated **once** by an external LLM chat session (not a script in the repo), reviewed informally for obvious errors, and committed manually to the repository as JSON files.

- **Source of truth for menu facts:** `data/menu_front.md` and `data/menu_back.md`. These files are the authoritative input to the LLM prompt at content-generation time.
- **Quality strategy:** **No hallucinations** for factual content (MC questions, speed-round questions). Every question's correct answer MUST be traceable to a specific line in the menu source. The authoring workflow uses a menu-first approach: build a structured fact ledger from the menu, generate questions only from that ledger, then run a dedicated verification pass cross-referencing every committed question against the menu. Where a question can't be verified with 100% confidence, it does NOT ship. (Inventive content — personality message pools — has no facts to hallucinate; voice consistency is the quality bar there.) See PRD decision log entry 2026-05-23 "Content quality bar override" for the history.
- **Voice consistency:** All 370 personality messages MUST share a recognizable voice — irreverent, sharp, willing to be harsh or profane in the "doing badly" pools and to praise enthusiastically in the "doing well" pools. The reference vibe is *"Fuck yea, you are amazing, and possibl[y] a genius."*
- **Menu drift:** When the Kildares menu changes (price tweak, new item, removed item, etc.), the affected questions SHALL be manually identified using the `menuRefs` field on each question, and the questions SHALL be either regenerated or hand-edited. There is no automated drift detection in v1.

## 7. Deployment

- Source code is hosted in GitHub (this repository).
- Deployment is via AWS Amplify, configured to build from the `main` branch and serve from a public HTTPS URL.
- An `amplify.yml` or equivalent Amplify console configuration SHALL be committed to the repository to define the build command and output directory.

## 8. Success Criteria

Stakes-appropriate, learning-project-modest. Success is self-judged.

**Primary success signals:**

- A new server can open the app on a phone and complete a full 30-round game without confusion or technical breakage.
- After several plays, the player demonstrably learns menu facts they did not previously know (self-assessed; not measured by the app).
- The personality voice lands — players want to read the next feedback message rather than skip past it.
- The app builds and deploys cleanly on push to `main` via AWS Amplify, with no manual intervention.
- The content pipeline (LLM-generated → committed → loaded by app) produces enough variety that plays 1–10 do not feel repetitive.

**Counter-metrics (what would indicate the design is wrong):**

- Players quit mid-game frequently because the timer feels arbitrarily punishing or the voice feels obnoxious rather than fun.
- Players notice content errors (wrong prices, wrong ingredients) often enough to lose trust in the app as a learning tool.
- Drag-and-drop on mobile is sufficiently frustrating that Type A questions are systematically failed for UX reasons rather than knowledge reasons.

## 9. Out of Scope (v1)

Explicit non-goals. These may revisit in v2 or never:

- **Accessibility** — keyboard navigation, screen-reader support, contrast standards, focus management. Deferred per brief decision.
- **End-to-end browser-automation tests** — Playwright, Cypress, or equivalent. (Unit and component tests ARE required — see NFR9.)
- **A build-time question-generator script in the repo** — content is generated externally in an LLM chat session and pasted in. No automated generator pipeline.
- **A programmatic / automated question-correctness validator** — correctness verification is done at authoring time by the dev agent against the menu source (see §6 Content Authoring Pipeline). No standalone validator tool ships in v1.
- **Login, accounts, leaderboards, cross-device sync** — no user identity.
- **Per-question history, seen-question avoidance, adaptive difficulty** — repeats are allowed and the question selection is purely random.
- **Shared-device support** — single user per device assumed.
- **Manager / admin tooling, content-authoring UI** — content is edited as JSON in the repo.
- **Mid-game resume after refresh** — refresh restarts.
- **Multi-language support** — English only.
- **Any feature from the 2026-05-22 brainstorming session not explicitly included above** — SRS, allergen-only modes, QR-on-menu bridge, memory palace, etc. are intentionally not in v1.

## 10. Open Items for Architecture / Design

Items the PRD intentionally leaves for downstream workflows (`bmad-create-architecture`, `bmad-create-ux-design`):

- **Framework choice** — React, Svelte, Vue, vanilla TS, etc. The PRD specifies TypeScript as a language constraint (NFR5); the architecture step picks the framework.
- **Build tool** — Vite, esbuild, etc. Architecture decision.
- **Test framework + DOM environment** — Vitest vs Jest, JSDOM vs happy-dom, Testing Library variant matched to the framework choice. Architecture decision constrained by NFR9.
- **Drag-and-drop implementation** — native HTML5 drag API, a library like dnd-kit or interact.js, or a custom touch-event handler. Has real UX implications on mobile (FR14, counter-metric in §8).
- **Animation library** — CSS keyframes, Framer Motion, GSAP, or hand-rolled. Affects FR49–FR52.
- **Question pool storage layout** — single file per type vs sectioned files per menu category. Architecture decision; impacts maintainability when menu changes.
- **Start screen visual design and the End screen layout** — UX-spec scope, not PRD.
- **Visual identity execution** — specific palette, typography, motion language. UX-spec scope. Direction recorded in brief: fresh game-energy primary, Irish-pub bonus, reference at `kildarespubwc.com`.
- **The `amplify.yml` content** — build command, install command, artifact directory. Architecture/devops scope.

## 11. Appendix — Pointers

- **Source brief:** `_bmad-output/planning-artifacts/briefs/brief-skilldares-2026-05-23/brief.md`
- **Brief decision log:** `_bmad-output/planning-artifacts/briefs/brief-skilldares-2026-05-23/.decision-log.md`
- **PRD decision log (this PRD's gap resolutions):** `_bmad-output/planning-artifacts/prds/prd-skilldares-2026-05-23/.decision-log.md`
- **Menu source files:** `data/menu_front.md`, `data/menu_back.md`
- **2026-05-22 brainstorming session (concept origin, specific mechanics not carried forward):** `_bmad-output/brainstorming/brainstorming-session-2026-05-22-1714.md`
