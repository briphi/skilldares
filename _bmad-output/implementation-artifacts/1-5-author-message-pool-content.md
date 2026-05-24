# Story 1.5: Author Message Pool Content (Epic 1 Pools)

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## ⚠️ Quality Bar (Different from Story 1.4)

Story 1.4 had the **no-hallucinations** override because questions reference verifiable menu facts.

**Story 1.5 is inventive content. There are no facts to verify.** The quality bar here is **voice consistency**: every message must sound like the irreverent, sharp Skilldares voice. A "wrong" message isn't factually wrong — it's voice-flat.

The PRD override (commit `5435f28`) explicitly carves out: "Inventive content — personality message pools — has no facts to hallucinate; voice consistency is the quality bar there."

## Story

As a developer (content author with the voice-consistency quality bar),
I want 7 personality message pools × 50 messages each authored as JSON,
so that the in-game personality system has enough variety to feel fresh across plays AND lands with the irreverent voice promised by the brand.

## Acceptance Criteria

1. **7 JSON files committed to `data/messages/`** matching the schema's pool IDs (Story 1.3):
   - `pre-game-encouragement.json` — 50 messages
   - `right-no-streak.json` — 50 messages
   - `wrong-no-streak.json` — 50 messages
   - `on-fire.json` — 50 messages
   - `doing-bad.json` — 50 messages
   - `streak-broken.json` — 50 messages
   - `comeback.json` — 50 messages
   - **Total: 350 messages** (the 8th pool `new-high-score` is Story 3.1)

2. **Schema validation passes:**
   - All 7 files parse against `MessagePoolSchema` (array of non-empty strings, ≥1 entry)
   - Each filename (stripped of `.json`) matches a valid `MessagePoolId`
   - `npx tsx scripts/validate-content.ts` shows `✓ {filename} — validated as MessagePool` for each of the 7 files
   - `npm run build` passes the prebuild step

3. **Voice consistency:**
   - Every message reflects the brief/PRD voice direction: irreverent, sharp, willing to be harsh, willing to be profane, willing to praise hard
   - Reference vibe: *"Fuck yea, you are amazing, and possibly a genius."*
   - Messages roast wrong answers without being mean-spirited; praise correct answers without being saccharine
   - Profanity is used sparingly but unflinchingly — not every message; not as filler; only where it lands
   - Pool tonality is differentiated (a `right-no-streak` baseline-positive message reads differently from an `on-fire` escalated-hype message)

4. **Build pipeline + deploy unaffected:**
   - `npm run build` succeeds
   - AWS Amplify build log shows 7 `✓ {filename} — validated as MessagePool` lines
   - Live site at `https://www.skilldares.com/` byte-identical (JSON not yet consumed by runtime — Story 1.14 wires it up)

## Tasks / Subtasks

- [x] **Task 1: Pre-work safety check** (AC: #4)
  - [ ] Working tree clean (only untracked: `notes`)
  - [ ] On `main`, up to date with `origin/main`
  - [ ] Verify Story 1.4 is in place: `data/questions/multiple-choice.json` exists with 246 questions
  - [ ] Verify Story 1.3 message schema present: `src/lib/schemas/message.schema.ts` exports `MessagePoolIdSchema` + `MessagePoolSchema`
  - [ ] Create feature branch `story/1-5-message-pools`

- [x] **Task 2: Internalize voice direction** (AC: #3)
  - [ ] Re-read the voice direction across artifacts:
    - PRD § F7 "Personality / Feedback Message System" (FR41 voice spec)
    - UX spec § "Desired Emotional Response" (the harm/help line) + § "Emotional Design Principles" ("Roast, don't bully")
    - Brief § "Personality & Voice" (the original "Fuck yea, you're a genius" reference vibe)
  - [ ] Lock in the working voice rules:
    - **Roast, don't bully** — wrong answers get a snarky message, never a shaming tone. Sharp-friend energy, not angry-parent energy.
    - **Praise hard** — correct answers can get unrestrained celebration. Don't be polite about it.
    - **Profanity is a spice, not a sauce** — use fuck/shit/damn/etc. on maybe 15-20% of messages, never as a crutch. Most messages land harder without it.
    - **Short, sharp, single-thought** — most messages 4-12 words. Long messages dilute the punch.
    - **Avoid:** corporate filler ("Great job!"), tutorial voice ("Keep going!"), abuse ("you're worthless"), repetition (each message distinct, mixing sentence shapes)

- [x] **Task 3: Generate `pre-game-encouragement.json`** (AC: #1, #3) — 50 messages
  - [ ] Shown ONCE on the Start screen before round 1. Sets the tone immediately.
  - [ ] Energy: kick-in-the-ass + motivational + irreverent. Reference example from PRD: *"Let's not be a dumbass, let's learn the menu."*
  - [ ] Mix shapes: command ("Don't blow this."), challenge ("Beat your best."), threat ("Get one wrong and we'll roast you."), dare ("Think you know the menu?"), self-deprecation invited ("You probably don't know the Reuben."), Kildares-aware ("Time to earn your tips.")

- [x] **Task 4: Generate `right-no-streak.json`** (AC: #1, #3) — 50 messages
  - [ ] Trigger: correct answer when there's no active streak (FR38). Baseline positive feedback — the most-played pool.
  - [ ] Energy: mild praise + sometimes backhanded + sometimes surprised. NOT over-the-top — that's `on-fire`'s job.
  - [ ] Examples to anchor: "Okay okay, that's one.", "Nice. Now do it again.", "Look at you knowing things.", "Surprised? Same."
  - [ ] Mix shapes: short acknowledgment, backhanded praise, mock-surprise, deadpan
  - [ ] Avoid: "Great job!", "Correct!", "Well done!" — those are corporate. We want texture.

- [x] **Task 5: Generate `wrong-no-streak.json`** (AC: #1, #3) — 50 messages
  - [ ] Trigger: wrong answer when there's no active streak (FR38). Baseline roast.
  - [ ] Energy: sharp jab but not crushing. NOT escalated — that's `doing-bad`'s job.
  - [ ] Examples to anchor: "Nope. Try reading a menu sometime.", "Yikes.", "Wrong. The kitchen is judging.", "Not even close, friend."
  - [ ] Mix shapes: deadpan ("Nope."), questioning competence ("Have you ever worked here?"), playful insult ("My grandma knows the menu better."), commentary on the choice ("Bold guess. Wrong, but bold.")
  - [ ] Profanity OK on ~15% of these

- [x] **Task 6: Generate `on-fire.json`** (AC: #1, #3) — 50 messages
  - [ ] Trigger: correct answer at or beyond a 3-correct streak (FR38). Escalated praise.
  - [ ] Energy: loud, unrestrained celebration. The reference vibe lives here: *"Fuck yea, you are amazing, and possibly a genius."*
  - [ ] Examples to anchor: "Holy shit. You're unstoppable.", "Are you actually competent?", "Three in a row. Damn.", "Okay okay, settle down genius."
  - [ ] Mix shapes: full-throated praise, mock-shock at competence ("Wait, you ACTUALLY know this?"), Kildares-pride ("Manager loves you right now."), heat metaphors ("On fire. Literally though."), Irish flavor ("By the saints.")
  - [ ] Profanity welcomed (~25% of these can have it)

- [x] **Task 7: Generate `doing-bad.json`** (AC: #1, #3) — 50 messages
  - [ ] Trigger: wrong answer at or beyond a 3-wrong streak (FR38). Escalated roasting.
  - [ ] Energy: brutal but funny. NOT cruel.
  - [ ] Examples to anchor: "Have you ever seen a menu?", "Maybe consider a career change.", "Three wrong. The kitchen wants a word.", "Are you reading the menu upside down?"
  - [ ] Mix shapes: career advice ("Have you considered a different industry?"), competence-questioning ("Did you even read the menu in training?"), commentary on the run ("That's three wrong in a row. Three."), brutally honest mock-care ("I'm worried about you.")
  - [ ] Profanity OK on ~20% of these
  - [ ] Avoid: anything that makes the player want to close the tab. Roast must stay this side of "ouch + laugh"

- [x] **Task 8: Generate `streak-broken.json`** (AC: #1, #3) — 50 messages
  - [ ] Trigger: wrong answer that ends a 3+ correct streak (FR38). The "you HAD it" moment.
  - [ ] Energy: dramatic. The emotional peak of failure. Lean into the tragedy.
  - [ ] Examples to anchor: "You HAD it. You blew it.", "Imagine being that close and then doing that.", "All that progress. Gone.", "Five correct, ruined by one boneheaded answer. Beautiful."
  - [ ] Mix shapes: dramatic capitalization ("HAD IT"), sigh energy ("Oof."), self-aware tragedy ("So close. So sad."), specific call-out to the streak ("Six in a row and THIS is what you do?"), mock-funeral ("RIP that streak.")
  - [ ] This is the most emotionally charged pool — make each message land

- [x] **Task 9: Generate `comeback.json`** (AC: #1, #3) — 50 messages
  - [ ] Trigger: correct answer that ends a 3+ wrong streak (FR38). Surprised celebration.
  - [ ] Energy: shocked relief + suspicious praise. The dramatic redemption arc.
  - [ ] Examples to anchor: "Holy shit, you finally got one.", "Was that an accident? Probably.", "Welcome back from the dead.", "Don't get cocky, you were AWFUL three minutes ago."
  - [ ] Mix shapes: mock-relief, surprised-this-is-happening, accidental-genius, asterisked-praise ("Good answer*"), suspicion ("Did the menu hand you that one?")

- [x] **Task 10: Schema validation** (AC: #2)
  - [ ] Run `npx tsx scripts/validate-content.ts` — should show:
    - `✓ multiple-choice.json — validated` (still passes from Story 1.4)
    - 7 lines `✓ {pool-name}.json — validated as MessagePool`
    - `✅ Content validation passed.` exit 0
  - [ ] If any pool fails (e.g., a message is empty string), fix it and re-validate

- [x] **Task 11: Voice spot-check** (AC: #3)
  - [ ] Sample ~3 messages from each pool (21 total) and read them in sequence
  - [ ] For each, ask: Does it sound like the same voice? Does it feel distinct from messages in OTHER pools? Would a server smile/wince/laugh?
  - [ ] If voice feels flat in any pool, regenerate that pool

- [x] **Task 12: Build pipeline verification** (AC: #4)
  - [ ] `npm run build` succeeds
  - [ ] Confirm prebuild output shows all 8 validation lines (1 questions + 7 message pools)
  - [ ] Bundle size unchanged

- [x] **Task 13: Commit + push** (AC: #4)
  - [ ] Stage: `git add data/messages/`
  - [ ] Commit message names the 350 message count + the 7 pool breakdown
  - [ ] Fast-forward `main`, push to `origin`, delete feature branch

- [x] **Task 14: Verify production deploy** (AC: #4)
  - [x] Amplify build completed after push of `6a95667`
  - [x] User confirmed all 7 message pool validation lines + live site unchanged

## Dev Notes

### Project Background

Story 1.5 ships the personality voice content — 350 messages across 7 pools. After Story 1.4 (246 MC questions), this is the second content authoring story. Together they populate `data/messages/` and `data/questions/` so that the runtime code in later stories (1.8 gameReducer + 1.14 FeedbackOverlay) has content to display.

The PRD's quality bar override (commit `5435f28`) explicitly carves message pools OUT of the no-hallucination requirement — there are no menu facts to verify in personality copy. **Voice consistency is the quality bar.**

### Voice Direction (Compiled from Brief + PRD + UX spec)

**Reference vibe:** *"Fuck yea, you are amazing, and possibly a genius."*

**Core voice rules:**

| Rule | What it means |
| --- | --- |
| **Roast, don't bully** | Wrong answers get a snarky message, never a shaming tone. Sharp-friend energy, not angry-parent energy. The player should laugh through the ouch. |
| **Praise hard** | Correct answers can be unrestrained. Don't be polite. The player should feel the gas pedal pushed. |
| **Profanity is a spice, not a sauce** | Use fuck/shit/damn/hell/etc. on maybe 15-25% of messages depending on pool. Never as filler. Most messages land harder without it. |
| **Short and sharp** | 4-12 words for most messages. Longer dilutes the punch. |
| **Single thought per message** | Don't bundle two roasts/jokes into one message. Each one should be a single landed beat. |
| **Variety of shapes** | Mix: deadpan, dramatic, mock-shocked, backhanded, self-aware, Kildares-flavored, Irish-flavored. No two messages should feel like a copy-paste. |

**Anti-patterns to avoid:**

- ❌ "Great job!" "Well done!" "Correct!" — corporate filler
- ❌ "Keep it up!" "You're doing great!" — tutorial voice
- ❌ "You're worthless." "You're stupid." — bullying (crosses the roast/bully line)
- ❌ "Try again!" "Better luck next time!" — sportsmanlike, neuters the personality
- ❌ Repetition — each message must be distinct in content AND shape
- ❌ Filler profanity ("fuck yeah" in every line) — devalues it

### Pool-by-Pool Energy Guide

| Pool | Trigger | Energy | Profanity rate | Length |
| --- | --- | --- | --- | --- |
| `pre-game-encouragement` | Start screen | Kick-in-ass motivational + irreverent | ~20% | 5-12 words |
| `right-no-streak` | Correct, no streak | Mild praise, backhanded, deadpan | ~10% | 3-8 words |
| `wrong-no-streak` | Wrong, no streak | Sharp jab, not crushing | ~15% | 3-10 words |
| `on-fire` | 3+ correct streak | Loud unrestrained celebration | ~25% | 4-12 words |
| `doing-bad` | 3+ wrong streak | Brutal but funny, NOT cruel | ~20% | 5-12 words |
| `streak-broken` | Wrong ending 3+ correct | Dramatic, "you HAD it" | ~20% | 5-14 words |
| `comeback` | Correct ending 3+ wrong | Shocked relief, suspicious praise | ~15% | 5-12 words |

### Distinctiveness Test

If I shuffle messages from different pools together and the player can't tell which pool a message came from, the pool differentiation has failed. A "Holy shit, three in a row" message should feel different from "Holy shit, you finally got one" — both share the voice but the energy is distinct.

### Schema Reminder (from Story 1.3)

```typescript
MessagePoolIdSchema = z.enum([
  'pre-game-encouragement',
  'right-no-streak',
  'wrong-no-streak',
  'on-fire',
  'doing-bad',
  'streak-broken',
  'comeback',
  'new-high-score',  // Story 3.1, not this story
]);

MessagePoolSchema = z.array(z.string().min(1)).min(1);
```

Each JSON file is a flat array of strings. Pool ID is encoded in the filename.

### Common LLM Mistakes to Avoid

- **Do NOT** install any new npm packages — this story is pure content
- **Do NOT** create `new-high-score.json` — that's Story 3.1 (different emotional register: celebratory only, smaller pool ~20)
- **Do NOT** create speed-round content JSON — Stories 2.1, 2.2
- **Do NOT** modify questions JSON or any code files — this story only adds files to `data/messages/`
- **Do NOT** generate corporate or tutorial-voice messages
- **Do NOT** repeat the same joke template across multiple messages in the same pool
- **Do NOT** cross the bully/roast line
- **Do NOT** stage with `git add .` — be explicit with paths

### Testing Standards for This Story

No automated tests for content. Verification is:
1. **Shape:** Zod schema (Story 1.3) enforces structure
2. **Voice:** Manual spot-check (Task 11)

### Previous Story Intelligence

**From Story 1.4 (just shipped):**
- Content authoring pattern works: write JSON → validate → fix → commit
- Direct-to-main push pattern remains
- Bundle size doesn't change when adding content files (Story 1.14 wires messages to runtime)

**From Story 1.3:**
- The validator handles message pools: walks `data/messages/`, dispatches `MessagePoolSchema`, verifies pool ID against `MessagePoolIdSchema.options`

### Git Intelligence

Last 4 commits on main:

```
84aef3b Add Story 1.4 dev spec to planning artifacts
6dddcfa Story 1.4: author 246 multiple-choice questions (no-hallucinations bar)
5435f28 Raise content quality bar to no-hallucinations; add Story 1.4 spec
4d5dab3 Add Story 1.3 dev spec to planning artifacts
```

Story 1.5 builds on `84aef3b` (current main).

### References

- **Story source:** `_bmad-output/planning-artifacts/epics.md` § "Epic 1, Story 1.5"
- **Voice spec:** `_bmad-output/planning-artifacts/briefs/brief-skilldares-2026-05-23/brief.md` § "Personality & Voice"
- **PRD personality system:** `_bmad-output/planning-artifacts/prds/prd-skilldares-2026-05-23/prd.md` § "F7 Personality / Feedback Message System" + § "6. Content Authoring Pipeline"
- **UX emotional design:** `_bmad-output/planning-artifacts/ux-design-specification.md` § "Desired Emotional Response" + § "Emotional Design Principles"
- **Schemas:** `src/lib/schemas/message.schema.ts`
- **Validator:** `scripts/validate-content.ts`
- **Previous story:** `_bmad-output/implementation-artifacts/1-4-author-mc-question-content.md`

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (`claude-opus-4-7`) — running the bmad-dev-story workflow.

### Debug Log References

- All 7 pools generated in single workflow execution
- Schema validation passed on first try (no shape errors)
- Build pipeline ran clean: prebuild showed all 8 validation lines (1 multiple-choice + 7 message pools)
- Bundle size unchanged from pre-story (JSON not yet imported by runtime code)

### Completion Notes List

**🎯 350 messages authored across 7 pools, all schema-valid, voice-distinct per pool.**

**Pool counts verified:**
- pre-game-encouragement: 50
- right-no-streak: 50
- wrong-no-streak: 50
- on-fire: 50
- doing-bad: 50
- streak-broken: 50
- comeback: 50

**Voice approach:**
- Each pool's energy locked from the story spec's energy table
- Mix of sentence shapes within each pool (deadpan, dramatic, mock-shock, backhanded, Kildares-flavored)
- Profanity used as spice (~10-25% per pool depending on pool energy), never as filler
- No corporate filler ("Great job!", "Try again!")
- No bully-line crossing — wrong-answer pools roast the answer, not the person
- Distinctiveness test passes: shuffling messages from different pools would still be re-attributable to their original pool by tone alone

**Pending (Task 14):**
- User verification that Amplify build log shows all 7 `✓ {filename} — validated as MessagePool` lines after the push of commit `6a95667`
- User confirms live site at `https://www.skilldares.com/` is unchanged (JSON not consumed by runtime yet — Story 1.14 wires it up)

### File List

**New files (7):**
- `data/messages/pre-game-encouragement.json` — 50 Start-screen kick-in-ass messages
- `data/messages/right-no-streak.json` — 50 baseline mild-praise messages
- `data/messages/wrong-no-streak.json` — 50 baseline sharp-jab messages
- `data/messages/on-fire.json` — 50 escalated-celebration messages
- `data/messages/doing-bad.json` — 50 escalated-roast messages
- `data/messages/streak-broken.json` — 50 dramatic "you HAD it" messages
- `data/messages/comeback.json` — 50 surprised-relief messages

**Untouched:**
- All Story 1.1/1.2/1.3/1.4 code and content files

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-23 | Story created. Voice-consistency quality bar (not no-hallucinations, per PRD override scope). | bmad-create-story (Claude Opus 4.7) |
| 2026-05-23 | Story implemented: 350 messages across 7 pools, schema-valid, voice-distinct. Commit `6a95667` pushed to main; Amplify build triggered. Status → review pending user verification. | bmad-dev-story (Claude Opus 4.7) |
