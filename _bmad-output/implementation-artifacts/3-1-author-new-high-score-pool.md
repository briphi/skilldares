# Story 3.1: Author new-high-score Message Pool

Status: review

## Story

As a developer (content author),
I want ~20 celebratory messages authored for the `new-high-score` pool,
so that beating the PB lands with personality variety across replays.

## ⚠️ Voice-consistency bar (not no-hallucinations)

Per the PRD post-finalize override (`2026-05-23`), the no-hallucinations bar applies to **factual** content (MC questions, speed-round questions). This story is **inventive** content — personality copy with no facts to hallucinate. The bar is **voice consistency**: every message reads like the same irreverent, willing-to-be-profane, willing-to-praise-hard voice that runs across the other 7 pools.

## Acceptance Criteria

1. **`data/messages/new-high-score.json` contains ~20 messages** (target 20; ±5 acceptable).

2. **All messages parse against `MessagePoolSchema`** (`z.array(z.string().min(1)).min(1)` from Story 1.3).

3. **Voice is explicitly celebratory.** Compared with the other 7 pools, this one is unique in that it ONLY fires on a beating-the-PB win — so every message should land in the "you actually did the thing" register. Range of celebration tones welcome:
   - Hard cursing celebration (`"Holy shit, look at you."`)
   - Deadpan disbelief (`"Statistically speaking, your past self is jealous."`)
   - Forward-pushing ("Now do this again.")
   - Light insults of past-self (`"You just embarrassed every previous version of yourself."`)

4. **Build-time validation passes:** `npm run build` runs `scripts/validate-content.ts` which parses `new-high-score.json` against `MessagePoolSchema`. (Validator already registers this file path — verified.)

5. **No tests required for this content story.** Schema validation covers correctness; voice is human-judged.

## Tasks / Subtasks

- [x] **Task 1: Pre-work safety check**
  - [x] Working tree clean; on `main`; up to date
  - [x] Verify `MessagePoolSchema` exists; 267 tests pass
  - [x] Verify `scripts/validate-content.ts` registers `new-high-score.json` (spot-check)
  - [x] Create branch `story/3-1-new-high-score-pool`

- [x] **Task 2: Author the 20-22 messages**
  - [x] Use the candidate list in Dev Notes as the starting point; iterate for voice
  - [x] Write directly to `data/messages/new-high-score.json` as a JSON array of strings

- [x] **Task 3: Build + test**
  - [x] `npm run build` — must exit 0 (content validation runs prebuild)
  - [x] `npm test` — all 267 tests still pass

- [x] **Task 4: Commit + push**
  - [x] Two commits (content + spec)
  - [x] Fast-forward main, push, delete branch

## Dev Notes

### Candidate Messages (22; dev agent can trim or iterate)

```json
[
  "Holy shit, look at you.",
  "New record. You earned that.",
  "You just embarrassed every previous version of yourself.",
  "That's a new ceiling. Try to beat it.",
  "Personal best. Take the win.",
  "You're cooking now. New high score.",
  "Whatever you did, do that again. New record.",
  "Crushed it. New best.",
  "Look at this. Look. At. This. New PB.",
  "Statistically speaking, your past self is jealous.",
  "New high score. Don't get cocky.",
  "Yeah you did. New record locked in.",
  "This is the part where you scream. New PB.",
  "You leveled up. Congrats, nerd.",
  "New record. Don't peak too early.",
  "You actually did it. Personal best.",
  "Best run yet. Bookmark it.",
  "New high score. The menu officially fears you.",
  "You made the leaderboard. The leaderboard is you, but still.",
  "That's a personal best. Now do it again.",
  "New record. The bar moves with you.",
  "You just rewrote your high score. Earned, not given."
]
```

### Voice Notes

- Mix energy levels — not every message needs to be hard-cursing. Variety > intensity.
- Forward-pushing endings ("Try to beat it", "Now do it again") keep the loop alive — they nudge replay.
- Self-referential bits ("the menu officially fears you", "the leaderboard is you") fit the irreverent register.
- Length: short. End-of-game celebration moment is glanceable, not a paragraph. Most under 70 chars.

### Common LLM Mistakes to Avoid

- **Do NOT** reference numerical scores in the message text — the score number is displayed separately on the End screen. Messages should be score-agnostic so they work for any winning score.
- **Do NOT** include items that imply specific context like "your 30th round" — messages must work for both Epic 1 milestone games (15 rounds) and Epic 2 full games (30 rounds).
- **Do NOT** invent menu facts or item names — no hallucination surface here, but staying generic keeps the messages future-proof.
- **Do NOT** include emojis in the message text itself — the EndScreen celebrating variant (Story 3.3) adds 🎉 to the header. Messages stay plain text.

### Previous Story Intelligence

**From Story 1.5 (other 7 pools):**
- Inventive content, voice-consistency bar (this story uses the same bar)
- Each pool 50 messages; this pool target is ~20 because new-high-score is a less-frequent trigger
- Existing `scripts/validate-content.ts` validates all 8 pools (the 7 existing + this new one) — verified by spot-check

**From Story 1.3 (schemas):**
- `MessagePoolSchema = z.array(z.string().min(1)).min(1)` — no other constraints

### Git Intelligence

Last 4 commits on main:

```
f26d902 Add Story 2.8 dev spec to planning artifacts
ed93917 Story 2.8: Epic 2 integration — full 30-round production game
40b0bd2 Update Story 2.7 spec: mark review + fill Dev Agent Record
e354744 Add Story 2.7 dev spec to planning artifacts
```

Story 3.1 builds on `f26d902`.

### Latest Tech Information

No new dependencies. Pure content addition.

### Project Structure Notes

**Alignment with architecture:**
- `data/messages/new-high-score.json` ✓ (architecture line 459: "new-high-score.json # ~20")

### References

- **Story source:** `_bmad-output/planning-artifacts/epics.md` § "Epic 3, Story 3.1"
- **PRD FRs:** FR47 (celebratory message + PB update), FR41 (voice consistency)
- **PRD content-quality bars:** `.decision-log.md` § "Quality strategy" — inventive content uses voice-consistency bar, not no-hallucinations
- **Schema:** `src/lib/schemas/message.schema.ts`
- **Validator:** `scripts/validate-content.ts`

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code)

### Debug Log References

None — schema validation passed on first run.

### Completion Notes List

- 22 messages shipped in `data/messages/new-high-score.json` (verbatim from the spec's candidate list — voice held).
- All 8 message pools now validate via prebuild check (the validator already wired `new-high-score.json` via `MessagePoolIdSchema` from Story 1.3; no script update needed).
- 267 tests still pass (no behavior change — pure content addition).
- Bundle unchanged at this story (the JSON isn't imported by any source file YET; Story 3.3's EndScreen celebrating variant will pull it in).

### File List

- **NEW** `data/messages/new-high-score.json`

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-24 | Story created. 22 candidate messages drafted inline (variety: hard-curse, deadpan, forward-pushing, light self-insult). Voice-consistency bar per PRD; no menu facts to hallucinate. | bmad-create-story (Claude Opus 4.7) |
| 2026-05-24 | Story shipped. 22 messages validated. Bundle unchanged — JSON not yet imported (Story 3.3 will wire it in). | bmad-dev-story (Claude Opus 4.7) |
