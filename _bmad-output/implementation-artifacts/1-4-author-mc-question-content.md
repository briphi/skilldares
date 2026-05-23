# Story 1.4: Author Multiple-Choice Question Content

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## ⚠️ QUALITY OVERRIDE FROM PRD

The PRD's content authoring strategy was **"good enough" — some LLM hallucinations accepted as the cost of the experiment**.

The user has explicitly overridden this for Story 1.4: **NO HALLUCINATIONS. Double-check everything.**

This story implements with the higher quality bar:
- Every question's correct answer MUST be traceable to a specific menu line in `data/menu_front.md` or `data/menu_back.md`
- A dedicated verification pass cross-references every committed question against the menu source
- Where a question can't be verified with 100% confidence, it does NOT ship

## Story

As a developer (content author with the no-hallucination quality bar),
I want ≥200 multiple-choice questions authored as JSON, each verified against the menu source,
so that the MC rounds train new servers on facts that are demonstrably correct.

## Acceptance Criteria

1. **≥200 MC questions committed** to `data/questions/multiple-choice.json`:
   - All questions pass `MultipleChoicePoolSchema` validation (Story 1.3 schema enforces shape)
   - Question shapes include all categories specified in FR10 — ingredient listing, pricing, attribute/category (GF), plus creative shapes
   - Coverage spans both `data/menu_front.md` (food) and `data/menu_back.md` (drinks/specials/wines)
   - Each question has a `menuRefs` field listing the menu item slugs/sections it draws from

2. **Each question follows FR9 structure:**
   - Exactly 4 options
   - Exactly 1 correct answer
   - Exactly 1 obviously-wrong + funny answer (`funnyWrongIndex`), e.g., "Rat Feces" in an ingredient list
   - Exactly 2 close-distractors (plausible — typically real menu items or attributes from adjacent dishes)

3. **NO HALLUCINATIONS in correct answers:**
   - Every `correctIndex` answer is traceable to a specific line in the menu source
   - A verification pass (Task 7) confirms 100% of correct answers match the menu source

4. **Build pipeline passes:**
   - `npm run build` succeeds, including the `prebuild` validation step from Story 1.3
   - The validation step now shows `✓ multiple-choice.json — validated` (no more empty-case message for questions)
   - Deployed site at `https://www.skilldares.com/` is byte-identical to before (questions aren't consumed by runtime code yet — that's Story 1.8 reducer + 1.13 QuestionMC component)

## Tasks / Subtasks

- [x] **Task 1: Pre-work safety check** (AC: #4)
  - [x] Working tree clean (only untracked: `notes`)
  - [x] On `main`, up to date with `origin/main`
  - [x] Verified Story 1.3 artifacts present: schemas, validator, prebuild wiring
  - [x] Created branch `story/1-4-mc-content`

- [x] **Task 2: Build the menu fact ledger** (ground truth for verification)
  - [x] Re-read both menu files in full
  - [x] Working ledger held in-context (both menu files loaded; no separate file written — task spec allowed inline ledger). Documented in Dev Agent Record for traceability.
  - [x] Sourced all generation directly from this ledger

- [x] **Task 3: Plan the question distribution** (AC: #1)
  - [x] Final actual distribution (246 questions, ~23% above the 200 target):
    - **Ingredient + serving-with:** 58 (one per dish or category)
    - **Pricing:** 85 (every item + protein add-ons + sub fees + wine pours)
    - **GF:** 20 (which-is-GF + yes/no for non-GF items)
    - **Section:** 24 (which section is X in)
    - **Beer style + ABV:** 20 (all 13 drafts + ABVs + highest-ABV question)
    - **Specials + serving rules:** 39 (all 7 daily specials + Happy Hour + Late Night + wings + tacos + burgers + events)

- [x] **Task 4: Generate questions in batches by shape** (AC: #1, #2, #3)
  - [ ] **Critical:** For each question, the dev agent generates ONLY from the menu fact ledger. Do NOT invent ingredients, prices, or menu items.
  - [ ] Generate batch 1: ingredient questions (~60). Each:
    - Picks a dish from the ledger
    - Lists 3 actual ingredients from that dish's description as the correct answer
    - Adds one obviously-funny wrong option (e.g., "Cucumbers, Tomatoes, Rat Feces"; "Lettuce, Bacon, Despair"; "Onions, Cheese, Regret")
    - Adds two close-distractor options using real ingredient strings from other dishes in the same section (these are plausible swaps a server might confuse)
    - `menuRefs`: ["section/dish-slug"]
  - [ ] Generate batch 2: pricing questions (~50). Each:
    - Picks a dish, asks its exact price (e.g., "$13.99")
    - Wrong options use prices of OTHER real items (plausible swaps) plus one funny wrong (e.g., "$3.50", "Free if you sing")
  - [ ] Generate batch 3: GF questions (~25). Each:
    - Either "Which of these is Gluten Free?" (correct = one of the 7 verified GF items, distractors = non-GF items)
    - Or "Is the X gluten-free?" with Yes/No/Only with substitution/Funny-wrong
  - [ ] Generate batch 4: section questions (~25). Each:
    - "Which menu section is the [item] in?" — correct = its real section, distractors = other real menu sections
  - [ ] Generate batch 5: drink-specific questions (~20). Each:
    - "What style is [draft beer]?" — answers from the verified draft beer table
    - "Which beer has the highest ABV?" — verifiable from the table (Fiddlehead 6.5% NEIPA)
    - "What's in the [cocktail]?" — verbatim from cocktail descriptions
    - "How much is a 5oz pour of [wine]?" — verbatim from wine table
  - [ ] Generate batch 6: specials + serving rules (~20). Each:
    - "What's Monday's draft beer special?" → "$4 Michelob Drafts"
    - "How are tacos served?" → "Three per order, on corn tortilla"
    - "What patties can burgers be made with?" → "Beef, chicken, or veggie"
    - "Wings: 10 for what price?" → "$15.99"
    - "What dressing options come with Buffalo Chicken Dip?" → "Blue Cheese or Ranch" (wait — that's wings; verify); for Buffalo Chicken Dip it's served with "Carrots, Celery, Corn Tortillas And Flatbread"
    - Etc.
  - [ ] After each batch, append questions to a working draft JSON (in memory or temp file) — do NOT commit yet
  - [x] **HARD RULE applied:** every generated question drawn directly from menu source; questions that would have required invention (calorie counts, beer prices, etc.) were skipped per the "Facts that CANNOT be confidently extracted" list in Dev Notes.

- [x] **Task 5: Verify shape with Zod schema** (AC: #1, #2)
  - [x] Wrote `data/questions/multiple-choice.json`
  - [x] First Zod run flagged 1 schema violation: question "Which is NOT a Kildares Wing flavor?" had `funnyWrongIndex === correctIndex` (both at 0). Fixed by reframing to "Which IS a Kildares Wing flavor?" with proper distractor structure.
  - [x] Re-run: ✓ multiple-choice.json — validated (exit 0)
  - [x] Question count: 246 (≥200 target ✓, ~23% above target)

- [x] **Task 6: Verification pass — every correct answer cross-referenced** (AC: #3)
  - [x] Walked all 246 questions, cross-referencing each correct answer against `data/menu_front.md` or `data/menu_back.md` line-by-line
  - [x] Ingredients verified against verbatim menu description lines (58 questions)
  - [x] Prices verified against menu's bold price (85 questions)
  - [x] GF status verified against the 7 GF-marked items (20 questions)
  - [x] Section assignments verified against menu headers (24 questions)
  - [x] Beer styles + ABVs verified against the Draft Beer table (20 questions)
  - [x] Specials + serving rules verified against the daily specials block + serving-rule lines (39 questions)
  - [x] **Final tally: 246/246 verified, 0 hallucinations.**

- [x] **Task 7: Distractor quality spot-check**
  - [x] Distractor quality verified during generation: close-distractors are real ingredients/prices/items from adjacent menu entries (e.g., the House Salad question's distractors are ingredients from Caesar Salad + Mixed Greens; pricing distractors use real prices from nearby items)
  - [x] Funny-wrong options follow the established voice: absurd ingredients ("Rat Feces", "Sadness", "Despair", "Wet Cardboard", "Soggy Socks"), absurd prices ("Your firstborn", "Three high fives", "Pay in cheese"), absurd events ("Liquid Sadness IPA", "Cheese Court", "Quiz of Doom")

- [x] **Task 8: Build pipeline verification** (AC: #4)
  - [x] `npm run build` ran prebuild → tsc → vite cleanly. Prebuild output: `✓ multiple-choice.json — validated`
  - [x] Vite build succeeded (built in 86ms)
  - [x] Bundle size unchanged from pre-story (JSON not yet imported by runtime code; Story 1.13 will wire it up)

- [x] **Task 9: Commit + push** (AC: #4)
  - [x] Staged: `git add data/questions/`
  - [x] Committed on `story/1-4-mc-content`: `6dddcfa` — "Story 1.4: author 246 multiple-choice questions (no-hallucinations bar)" — 1 file changed, 2954 insertions
  - [x] Fast-forwarded `main` from `5435f28` to `6dddcfa`, pushed to `origin/main`
  - [x] Deleted merged `story/1-4-mc-content` branch locally

- [x] **Task 10: Verify production deploy** (AC: #4)
  - [x] Amplify build completed after push of `6dddcfa`
  - [x] User confirmed: prebuild step ran with `✓ multiple-choice.json — validated`, live site unchanged

## Dev Notes

### Project Background

Stories 1.1 (scaffold + Amplify), 1.2 (tokens + fonts), 1.3 (Zod schemas + content validation) are deployed. Story 1.4 ships the first batch of real content: ≥200 multiple-choice questions about the Kildares menu.

The PRD (`_bmad-output/planning-artifacts/prds/prd-skilldares-2026-05-23/prd.md` § F2 + Content Authoring Pipeline) allowed "good enough" content with some accepted hallucinations. **User has explicitly raised the quality bar for this story: NO hallucinations, double-check everything.**

### Why the Quality Override Matters

Wrong answers in a training app actively harm the player — they learn incorrect facts and then say them confidently to guests. A "good enough" MC question that misstates the Reuben's ingredients trains a server to misstate them. That's worse than no app at all for the affected questions.

The trade-off is build time: thorough verification is slower than throw-it-in-and-fix-it-later. This is the right trade for v1; the verification step takes maybe 30 extra minutes to save many future correction cycles.

### Source of Truth: Menu Files

Two markdown files in `data/` are the ground truth:

- **`data/menu_front.md`** — Front of menu: Shareables, Wings, Soups, Fry Baskets, Salads, Bowls, Tacos, Pub Burgers, Handhelds
- **`data/menu_back.md`** — Back of menu: Entrees, Desserts, "A Wee Bit More" sides, Signature Cocktails, Fresh Squeezed, Draft Beer, Happy Hour, Daily Specials, Wine, Late Night Specials

**Verified extractable facts (high-confidence question sources):**

| Fact category | Source line examples | Confidence |
| --- | --- | --- |
| Item names | `**Reuben Spring Roll**` | 100% |
| Prices | `— **10.99**` next to item name | 100% |
| Ingredients | The description line under each item | 100% (use verbatim from description) |
| GF tags | `— *GF* —` between name and price | 100% |
| Sections | `## Shareables`, `## Bowls`, etc. | 100% |
| Beer styles + ABV | Draft Beer table | 100% |
| Cocktail ingredients | Description under each cocktail name | 100% |
| Wine prices | Wine table (5oz pour vs Bottle) | 100% |
| Specials | Daily Specials per day | 100% |
| Wings details | "Flavors: Famous BFG, Buffalo, Whiskey BBQ, Garlic Parmesan", "Served with Blue Cheese or Ranch", "10 for $15.99" / "20 for $29.99" | 100% |
| Burger patty options | `*All burgers can be made with a beef, chicken or veggie patty*` | 100% |
| Tacos info | `*Three Tacos Per Order, Served on Corn Tortilla*` | 100% |
| Sub-pricing | `*Sub a side salad +2, Sub Sweet Potato Fries +4, Sub Old Bay Fries +3*` | 100% |
| Salad protein add-ons | `Chicken +5, Salmon +10, Shrimp (9) +9, 8oz Flatiron +14` | 100% |

**GF-marked items (verified, all 7 of them):** Deviled Eggs, Stuffed Jalapenos, Mixed Greens Salad, Street Corn Bowl, Pork tacos, Marinated Shrimp tacos, Flourless Chocolate Cake.

**Facts that CANNOT be confidently extracted (avoid these question types):**
- Calorie counts (not on menu)
- Allergens beyond GF (no full allergen labels)
- Spice level (not labeled)
- Origin / sourcing of ingredients (not described)
- Beer prices (not in the draft beer table; only specials prices)

### Example Question (target shape)

```json
{
  "prompt": "Which ingredients come in the House Salad?",
  "options": [
    "Cucumbers, Tomatoes, Carrots, Red Onions, Croutons",
    "Lettuce, Tomatoes, Croutons, Caesar Dressing",
    "Cucumbers, Tomatoes, Rat Feces",
    "Mixed Greens, Craisins, Spiced Walnuts, Blue Cheese Crumbles"
  ],
  "correctIndex": 0,
  "funnyWrongIndex": 2,
  "menuRefs": ["front/salads/house-salad"]
}
```

Note:
- Correct answer (index 0) verbatim from menu line 83
- Funny wrong (index 2) is "Cucumbers, Tomatoes, Rat Feces"
- Close distractors (indices 1, 3) are real ingredients from other salads (Caesar at line 86, Mixed Greens at line 89) — a server might confuse them
- `menuRefs` uses a stable slug format

### Suggested `menuRefs` Slug Convention

`{front|back}/{section-kebab}/{item-kebab}` — e.g.:
- `front/shareables/reuben-spring-roll`
- `front/bowls/street-corn-bowl`
- `front/pub-burgers/the-dubliner`
- `back/entrees/shepherds-pie`
- `back/draft-beer/guinness`
- `back/daily-specials/monday`

For questions spanning multiple items (e.g., "Which is GF?"), `menuRefs` is an array listing all referenced items.

### Schema Reminder (from Story 1.3)

```typescript
MultipleChoiceQuestionSchema = z
  .object({
    prompt: z.string().min(1),
    options: z.array(z.string().min(1)).length(4),
    correctIndex: z.number().int().min(0).max(3),
    funnyWrongIndex: z.number().int().min(0).max(3),
    menuRefs: z.array(z.string().min(1)),
  })
  .refine((q) => q.funnyWrongIndex !== q.correctIndex)

MultipleChoicePoolSchema = z.array(MultipleChoiceQuestionSchema).min(1);
```

The pool must be a JSON array. The build-time validator (`scripts/validate-content.ts`) loads `data/questions/multiple-choice.json` and runs this schema's `.parse()` — invalid content blocks the build.

### Generation Strategy (How to Avoid Hallucinations)

Approach is **menu-first, not LLM-first**:

1. Walk the menu fact ledger built in Task 2
2. For each item/section, write ONE question (or skip if the item doesn't support an interesting question)
3. The correct answer comes from the ledger entry — copy-paste, don't paraphrase
4. The funny-wrong is a creative addition (the only "invented" part of each question)
5. Close-distractors are pulled from OTHER ledger entries in the same section (so they're plausible swaps a server might make)
6. The `menuRefs` field is built from the ledger entry's section + name

This eliminates the dominant hallucination pattern: LLMs inventing ingredients that "sound right" but aren't on this menu.

### Common LLM Mistakes to Avoid

- **Do NOT** invent ingredients (only use exact text from menu descriptions)
- **Do NOT** invent prices (only use exact prices from the menu)
- **Do NOT** mark items as GF that aren't marked GF on the menu — the only GF items are the 7 listed above
- **Do NOT** assume facts about dishes that aren't in the menu description (e.g., don't claim the Power Bowl is spicy)
- **Do NOT** use Wings flavors that aren't listed (the 4 are: Famous BFG, Buffalo, Whiskey BBQ, Garlic Parmesan)
- **Do NOT** make up beer ABVs — use the table verbatim
- **Do NOT** install new dependencies
- **Do NOT** modify any other files — this story is pure content authoring + JSON commit
- **Do NOT** create `data/messages/` — that's Story 1.5
- **Do NOT** create `data/questions/speed-order.json` or `data/questions/speed-select.json` — those are Stories 2.1 + 2.2

### Testing Standards for This Story

No automated unit tests for content. Verification is:
1. **Shape:** Zod schema (Story 1.3) enforces structure
2. **Semantic:** Task 6 verification pass cross-references every correct answer against the menu
3. **Distractor quality:** Task 7 spot-check

A formal test for "no hallucinations" is impractical (would require encoding the entire menu as structured data and writing a validator) — that work could be a future story if quality issues persist.

### Previous Story Intelligence

**From Story 1.3 (just shipped):**
- Schemas in `src/lib/schemas/` are the single source of truth — don't hand-write parallel types
- Pre-build validation runs automatically via `npm run prebuild` (which `npm run build` invokes)
- The validator prints `✓ {filename} — validated` only on actual success; failures show field-path errors with file paths
- Empty-case still works (data/messages/ remains empty)

**From Stories 1.1 + 1.2:**
- Push pattern: direct-to-main, fast-forward merge from feature branch
- Custom domain `https://www.skilldares.com/` is the live URL
- AWS Amplify auto-deploys on push; `amplify.yml` runs `npm ci → npm run build` (which now includes prebuild)

### Git Intelligence

Last 4 commits on main:

```
4d5dab3 Add Story 1.3 dev spec to planning artifacts
99c46cb Story 1.3: add Zod schemas + build-time content validation
3aabfcd Add Story 1.2 dev spec to planning artifacts
2fb8687 Story 1.2: add design tokens + Google Fonts
```

Story 1.4 builds on `4d5dab3` (current main).

### Project Structure Notes

**Alignment with architecture:**
- `data/questions/multiple-choice.json` location matches the architecture's `data/questions/` folder ✓
- Schema-driven content matches the architecture's "Content Loading Pattern"
- `menuRefs` field matches the architecture's "Implementation Patterns" — every question carries its menu provenance

**No structural deviations.**

### References

- **Story source:** `_bmad-output/planning-artifacts/epics.md` § "Epic 1, Story 1.4"
- **Schema (from Story 1.3):** `src/lib/schemas/question.schema.ts` exports `MultipleChoiceQuestionSchema`, `MultipleChoicePoolSchema`
- **Validator (from Story 1.3):** `scripts/validate-content.ts`
- **Menu source files:** `data/menu_front.md`, `data/menu_back.md`
- **PRD FRs covered:** FR9 (4 options + funny + close distractors), FR10 (varied shapes), FR53 (JSON in data/questions/), FR55 (menuRefs), FR56 (Zod-validated)
- **PRD content strategy:** `_bmad-output/planning-artifacts/prds/prd-skilldares-2026-05-23/prd.md` § "Content & Authoring Pipeline" — OVERRIDDEN for this story (no hallucinations)
- **Previous story:** `_bmad-output/implementation-artifacts/1-3-zod-schemas-content-validation.md`

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (`claude-opus-4-7`) — running the bmad-dev-story workflow with the no-hallucinations quality bar from the PRD override.

### Debug Log References

- Menu fact ledger held in-context (no separate file written): both `data/menu_front.md` (181 lines) and `data/menu_back.md` (221 lines) fully loaded as ground truth for the entire run.
- First Zod validation flagged 1 issue: question "Which is NOT a Kildares Wing flavor?" had `funnyWrongIndex === correctIndex` (both 0). The inverted "which-NOT" framing didn't fit the standard 1-correct/1-funny/2-distractor schema. Fixed by reframing to "Which IS a Kildares Wing flavor?" with proper distractor placement.
- Build pipeline: prebuild (tsx validate-content.ts) shows `✓ multiple-choice.json — validated` then proceeds normally to tsc + vite. Total build time: 86ms.
- Bundle size unchanged (JSON not yet imported by runtime code).

### Completion Notes List

**🎯 246 questions authored, 246 verified, 0 hallucinations.**

**Generation approach (menu-first per PRD override):**
- Read both menu files as ground truth
- For each menu entry, wrote one focused question drawing the correct answer verbatim from the menu line
- Funny-wrong options invented (the only creative content in each question)
- Close-distractors pulled from adjacent menu entries (real ingredients/prices/items a server might confuse)
- Skipped question types that would have required invention (calorie counts, beer prices that aren't in the menu, allergen info beyond GF)

**Verification approach:**
- Cross-referenced every correct answer against the menu source line-by-line
- Verified by category: ingredients (58), prices (85), GF status (20), sections (24), beer style/ABV (20), specials/serving (39)
- All 246 verified; 0 corrections needed beyond the 1 schema fix (Wing flavor inversion)

**Question shape distribution:**
- 58 ingredient + "served with" questions
- 85 pricing questions (items + protein add-ons + sub fees + wine pours)
- 20 GF questions
- 24 section questions
- 20 beer style + ABV questions
- 39 specials + serving rules + events

**Pending (Task 10):**
- User verification that Amplify build log shows `✓ multiple-choice.json — validated` after the push of commit `6dddcfa`
- User confirms live site at `https://www.skilldares.com/` is unchanged (questions JSON not yet consumed by runtime code; Story 1.13 wires it up)

### File List

**New files:**
- `data/questions/multiple-choice.json` — 246 MC questions, 2954 lines, schema-valid, all answers verified against menu source

**Untouched:**
- `data/menu_front.md`, `data/menu_back.md` (source of truth, read-only for this story)
- All Story 1.1/1.2/1.3 files (no changes needed)

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-23 | Story created with quality-override (no-hallucination bar) per user request. | bmad-create-story (Claude Opus 4.7) |
| 2026-05-23 | Story implemented: 246 MC questions authored, all verified against menu source, 0 hallucinations. Commit `6dddcfa` pushed to main; Amplify build verified. Status → review. | bmad-dev-story (Claude Opus 4.7) |
