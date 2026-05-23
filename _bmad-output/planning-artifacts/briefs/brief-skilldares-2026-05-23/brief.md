---
title: "Skilldares — Product Brief"
status: draft
created: 2026-05-23
updated: 2026-05-23
---

# Skilldares — Product Brief

## Executive Summary

Skilldares is a static, browser-based quiz game that helps new servers at Kildares pub memorize the menu. A player runs through 30 rounds — 15 multiple-choice questions, then 15 speed-based questions — and walks away with a score. No login, no accounts, just play. The game has personality: it praises hard when the player is crushing it, and it insults them when they're not. The tone is part of the product.

The brief exists to organize the product's shape before a PRD is written. Decisions made here — game mechanics, scoring, content authoring strategy, technical foundation — are the constraints the PRD will detail.

## Audience

New servers in their first week at Kildares. They need to learn a real menu (food + drinks) well enough to recommend dishes, answer guest questions, and avoid pointing the GF guest at the gluten-laden burger. They probably study with a printed menu and a pen; Skilldares is meant to make that learning faster, more fun, and somewhat more memorable than the printed-menu loop.

The product assumes each server uses the app on their own phone. A shared-device scenario isn't designed for in v1 — the localStorage high score becomes meaningless if multiple people share a tab.

## The Product

A web page that loads, drops the player into a 30-round game, tracks their score, and gives them a number and a comment at the end. Then it offers them a Play Again button. That's the whole product surface.

What makes it work is the texture inside that loop: the questions vary in shape, the speed rounds get genuinely tense, and the feedback voice is sharp enough that the player wants to see what the game says next. The aim isn't to be a comprehensive training platform — it's to be a tight, fun thing a server reaches for during a slow shift or a bus ride.

## Game Mechanics

**Game shape.** 30 rounds per game. Rounds 1–15 are multiple choice. Rounds 16–30 are speed-based with a 15-second timer per question. Running score in the upper-right throughout. End screen shows total + Play Again. Play Again pulls a fresh random 30 from the question pool; repeats across plays are allowed.

**Multiple-choice rounds (1–15).** Four answer options per question: one correct, one obviously wrong and funny ("rat feces" as a salad ingredient), and two close-distractors that look plausible. Question shapes vary — ingredient listing, pricing, attribute/category (GF, etc.) — and the brief invites creative shapes the LLM author can invent. A "Hint" button greys out one random wrong answer; selecting the correct answer after using the hint scores 2 points instead of 5.

**Speed rounds (16–30).** Split roughly 50/50 between two formats. *Type A — Order:* 3–5 squares of menu items, the player drags them into the correct order by some factor (price, ABV, etc.); submit reveals the factor values beneath each square. *Type B — Multi-select:* 5 squares of items, the player selects every square that meets a criteria (e.g., "items in the Street Corn Bowl"); the correct set might be one item, or all five. Distractors are real menu items from adjacent dishes, not random text. Both types are all-or-nothing: exact match → 5 points; any deviation, or running out the 15-second clock → 0 points.

**Scoring summary.** 5 points per correct. 2 points if correct after using the hint (MC only). 0 points for wrong or timer expiry. No penalty for wrong answers beyond losing the points.

**Post-answer flow.** After submitting an answer, the game reveals correct/incorrect feedback and a message from the personality system (below), then shows a "Next" button (or "Finish" on round 30) the player must click to advance.

## Personality & Voice

The single most distinctive thing about Skilldares isn't its quiz mechanics — it's its mouth. After every answer, the game serves a message from one of seven pre-authored pools. Tone: irreverent, funny, willing to be harsh, willing to be profane. Reference vibe: "Fuck yea, you are amazing, and possibl[y] a genius."

The picker chooses a pool based on per-answer state plus streak awareness:

| Pool | Trigger | Pool size |
| --- | --- | --- |
| `pre-game-encouragement` | Start screen, before round 1 | 50 |
| `right-no-streak` | Correct answer, no active streak | 50 |
| `wrong-no-streak` | Wrong answer, no active streak | 50 |
| `on-fire` | Correct during 3+ correct streak | 50 |
| `doing-bad` | Wrong during 3+ incorrect streak | 50 |
| `streak-broken` | Wrong answer ending a 3+ correct streak | 50 |
| `comeback` | Correct answer ending a 3+ incorrect streak | 50 |

**Total: 350 pre-authored messages.** Each pool is large enough that repetition across plays is rare. The two streak-edge pools (broken and comeback) carry the most emotional weight — they're what make the game feel like it's *watching* the player.

## Content & Authoring Pipeline

All gameplay content — quiz questions, distractors, and the 350 personality messages — is generated **once** by an external LLM chat session, manually reviewed for obvious errors, and committed to the repo. The app never calls an LLM at runtime.

- **Question pool size:** ≥200 multiple-choice questions covering food + drinks across the menu, plus a speed-round pool sized to support 15 speed-round draws per game with variety across plays.
- **File format:** JSON files in `data/questions/` — `multiple-choice.json`, `speed-order.json`, `speed-select.json` — with TypeScript type definitions alongside that the runtime validates against. Reviewable in PR diffs; editable without a build step.
- **Menu linkage:** every question carries a `menuRefs` field listing the menu item keys it draws from. When the menu changes (a price tweak, a new special), questions can be traced and updated.
- **Quality strategy:** "good enough" for v1. Some LLM hallucinations are accepted as the cost of the experiment. A future LLM-driven review pass is explicitly deferred and not in v1 scope. Source of truth for menu facts: `data/menu_front.md`, `data/menu_back.md`.

## Technical Foundation

- **Language:** TypeScript.
- **Architecture:** static web app. No backend, no external API calls at runtime. All content lives in the repo.
- **Browser support:** modern Chrome and Safari, mobile and desktop responsive.
- **Source + deploy:** code in GitHub; AWS Amplify deploys it from `main` to a public HTTPS URL on push.
- **Persistence:** `localStorage` for personal high score only. No per-question history, no cross-device sync, no accounts.
- **Framework / build tool:** not specified at the brief stage — the PRD or architecture step picks it (React, Svelte, vanilla TS, etc.). `[ASSUMPTION: chosen during PRD/architecture, no specific opinion held here]`
- **Tests:** `[ASSUMPTION: no formal automated test suite for v1; manual verification only]` — can be revisited in the PRD.

## Visual Direction

The visual brief is a vibe, not a spec. Primary direction: a **fresh game-energy aesthetic** — bold, animated, playful, with motion. Elements fade in and out between states. During speed rounds, elements shake and vibrate as the 15-second timer runs out, telegraphing urgency. The energy of the visuals should match the energy of the voice — "Fuck yea, you're a genius" should look at home on the page.

Secondary direction: Irish-pub palette as a bonus where it doesn't fight the energy. Reference: the actual Kildares brand at `kildarespubwc.com`. The existing dark-green `index.html` styling is **not** a constraint and can be ignored.

## Scope (v1)

In scope for the first build:

- 30-round game (15 MC + 15 speed) with the mechanics described above
- ≥200 pre-authored multiple-choice questions + the speed-round pool
- 350 pre-authored personality messages across 7 pools
- Hint button (MC rounds only) with 2-point scoring
- Per-answer feedback with personality message
- End-of-game screen with score + Play Again
- Animated UI with fade transitions and speed-round shake
- localStorage high-score tracking, per-device
- AWS Amplify deploy from GitHub
- A `Start Game` instruction screen with a random pre-game message

## Out of Scope (explicitly deferred)

- Accessibility (keyboard nav, screen-reader support, contrast standards)
- Formal automated test suite
- A build-time question-generator script in the repo (questions are generated externally and pasted in)
- An LLM-driven question-correctness review pass
- Login, accounts, leaderboards, cross-device sync
- Per-question history, seen-question avoidance, adaptive difficulty
- Shared-device mode (single user per device assumed)
- Manager/admin tooling, content authoring UI
- Mechanics from the 2026-05-22 brainstorming session not explicitly included above (SRS, allergen lifeguard mode, QR-on-menu bridge, memory palace, etc.) — concept preserved, mechanics intentionally fresh

## Success Criteria

Because this is a learning project, success criteria are deliberately modest and self-judged:

- A new server can complete a full 30-round game on a phone or laptop without confusion or technical breakage.
- After a few plays, the player has demonstrably learned menu facts they didn't know before (self-assessed; not measured by the app).
- The personality voice lands — players want to see the next message, not skip past it.
- The app builds and deploys cleanly on push to GitHub via AWS Amplify, with no manual intervention.
- The content pipeline (LLM generation → manual commit → loaded by app) produces enough questions and messages that replays feel fresh for at least a handful of plays in a row.

## Open Questions for the PRD

These are the soft spots that the brief intentionally leaves open for the PRD or architecture step:

- **Framework / build tool choice** — React, Svelte, vanilla TS, Vite, etc. No opinion held here.
- **Speed-round pool sizing** — how many Type A and Type B questions to author to keep replays fresh. The MC pool target is ≥200; speed-round pool target is undefined.
- **The shared-device assumption** — worth validating with an actual Kildares manager before relying on the single-user-per-device model.
- **Instruction screen content** — what it actually teaches the player before round 1 (rules summary? sample question? just a vibe?).
- **The LLM author-time prompt design** — what prompt produces 200 quality questions in one pass, what review process catches the worst hallucinations.
- **`amplify.yml` and build config** — where it lives, what it runs.
