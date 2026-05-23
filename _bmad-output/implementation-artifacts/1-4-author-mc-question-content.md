# Story 1.4: Author Multiple-Choice Question Content

Status: ready-for-dev

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

- [ ] **Task 1: Pre-work safety check** (AC: #4)
  - [ ] `git status` clean (untracked `notes` is acceptable)
  - [ ] On `main`, up to date with `origin/main`
  - [ ] Verify Story 1.3 is in place: `src/lib/schemas/question.schema.ts` exports `MultipleChoicePoolSchema`, `scripts/validate-content.ts` exists, `package.json` has `prebuild` script
  - [ ] Create feature branch `story/1-4-mc-content`

- [ ] **Task 2: Build the menu fact ledger** (ground truth for verification)
  - [ ] Re-read `data/menu_front.md` and `data/menu_back.md` from start to finish
  - [ ] In a working scratchpad (can be inline in this Dev Agent Record's Debug Log), extract a structured per-dish/per-drink record:
    - Section (e.g., "Shareables", "Bowls", "Tacos", "Pub Burgers", "Draft Beer")
    - Name
    - Price (if listed)
    - Ingredients (verbatim list from the description line)
    - Attributes: `GF` flag if marked, "cooked to order" if marked with `*`
    - For drinks: style + ABV (draft beer only); pour/bottle prices (wine)
    - For specials: day + price
  - [ ] This ledger is the SINGLE source of truth used during generation AND verification

- [ ] **Task 3: Plan the question distribution** (AC: #1)
  - [ ] Allocate ~200 questions across these shapes (target counts; ±20% acceptable):
    - **Ingredient questions:** ~60 (one per dish, picking dishes with ≥3 ingredients to give the question substance)
    - **Pricing questions:** ~50 (mix of "How much is X?" + "Rank/pick by price")
    - **GF questions:** ~25 (mix of "Which is GF?" + "Is X GF?")
    - **Section questions:** ~25 ("Which section is X in?" — trains menu organization)
    - **Drink-specific questions:** ~20 (beer style, beer ABV, cocktail ingredients, wine pour price)
    - **Specials + serving rules:** ~20 (Monday special, what wings come with, taco tortilla type, burger patty options, etc.)
  - [ ] Total target: ~200 (will end up at 200–220 in practice)

- [ ] **Task 4: Generate questions in batches by shape** (AC: #1, #2, #3)
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
  - [ ] **HARD RULE:** if any question can't be verified from the ledger with 100% confidence, drop it. Quality > quantity.

- [ ] **Task 5: Verify shape with Zod schema** (AC: #1, #2)
  - [ ] Write the working draft to `data/questions/multiple-choice.json`
  - [ ] Run `npx tsx scripts/validate-content.ts` — must exit 0 with `✓ multiple-choice.json — validated`
  - [ ] If any shape errors, fix the JSON until validation passes
  - [ ] Verify count is ≥200 with a one-liner: `node -e "console.log(JSON.parse(require('fs').readFileSync('data/questions/multiple-choice.json')).length)"`

- [ ] **Task 6: Verification pass — every correct answer cross-referenced** (AC: #3)
  - [ ] **This is the critical no-hallucination gate.**
  - [ ] For each of the 200+ questions, re-load the menu source files and verify the answer is correct:
    - Ingredient questions: read the corresponding menu line; confirm the 3 stated ingredients appear in the description
    - Pricing questions: confirm the price matches the menu's bold price
    - GF questions: confirm the GF status matches the menu's GF tag
    - Section questions: confirm the dish is under the named section header
    - Beer/wine questions: confirm against the tables
    - Specials questions: confirm against the daily specials block
  - [ ] Track any failed verifications in the Debug Log
  - [ ] If a question fails verification, fix it (rewrite the correct answer + distractors as needed) and re-verify
  - [ ] Re-run `npx tsx scripts/validate-content.ts` after fixes
  - [ ] **Final tally in Dev Agent Record:** "Verified N/N questions, 0 hallucinations remaining"

- [ ] **Task 7: Distractor quality spot-check**
  - [ ] Sample ~20 random questions and check that close-distractors are plausible (real menu items where possible, not random text)
  - [ ] If many distractors are weak/obviously-wrong, regenerate them using the menu ledger
  - [ ] Funny-wrong options should be funny but obviously wrong (rat feces, soap, sadness, etc.)

- [ ] **Task 8: Build pipeline verification** (AC: #4)
  - [ ] Run `npm run build` — prebuild validation runs against the new content, must show `✓ multiple-choice.json — validated`
  - [ ] Verify `tsc -b && vite build` still succeeds
  - [ ] Confirm bundle size is unchanged (questions JSON is NOT yet imported by runtime code; Story 1.13 QuestionMC will import it)

- [ ] **Task 9: Commit + push** (AC: #4)
  - [ ] Stage explicitly: `git add data/questions/`
  - [ ] Commit message names the question count and explicit "no hallucinations verified" note
  - [ ] Fast-forward `main`, push to `origin`, delete feature branch

- [ ] **Task 10: Verify production deploy** (AC: #4)
  - [ ] Wait for Amplify build to complete
  - [ ] Confirm Amplify build log shows `✓ multiple-choice.json — validated` in the prebuild output
  - [ ] Confirm live site at `https://www.skilldares.com/` is unchanged

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

_To be filled by dev agent_

### Debug Log References

_To be filled by dev agent — include the menu fact ledger built in Task 2_

### Completion Notes List

_To be filled by dev agent_

### File List

_To be filled by dev agent_

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-23 | Story created with quality-override (no-hallucination bar) per user request. | bmad-create-story (Claude Opus 4.7) |
