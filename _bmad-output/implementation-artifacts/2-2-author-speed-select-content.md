# Story 2.2: Author Speed Round Type B (Multi-Select) Content

Status: review

## Story

As a developer (content author),
I want 40 Type B multi-select questions authored as JSON across the three criteria types (`items-in-dish`, `items-gf`, `items-in-section`),
so that the criteria-based speed rounds have variety and every "correct" item is a defensible truth from the menu source.

## ⚠️ No-hallucinations bar applies (per PRD post-finalize override, 2026-05-23)

Speed Type B questions reference factual content (which ingredients are in a dish, which items are gluten-free, which items belong to a section). The bar: every entry in `correctSet` must be 100% traceable to a specific line in `data/menu_front.md` or `data/menu_back.md`. Distractor items in the 5-item grid must also be REAL menu items per FR21 ("not random text").

## Acceptance Criteria

1. **`data/questions/speed-select.json` contains exactly 40 questions** matching `SpeedSelectQuestionSchema` (already shipped in Story 1.3).

2. **Criteria-type breakdown:** ~18 `items-in-dish` + ~8 `items-gf` + ~14 `items-in-section`. Approximate — within ±2 is fine.

3. **Per FR19, FR21, FR24:**
   - Exactly 5 items per question (schema enforces).
   - `correctSet` length 1–5 (schema enforces). Vary across questions: include at least one "all 5 correct" question, at least one "1 of 5 correct" question.
   - **Distractor items MUST be real menu items**, not invented strings. Verify each distractor by name appears somewhere in the menu.
   - All `correctSet` entries must appear in `items` (schema enforces via refine).
   - No duplicates in `correctSet` (schema enforces via refine).

4. **Prompt convention:**
   - `items-in-dish` → `"Pick what's in the {Dish Name}"`
   - `items-gf` → `"Pick what's gluten-free"`
   - `items-in-section` → `"Pick the {section}"` (e.g., `"Pick the tacos"`, `"Pick the burgers"`, `"Pick the signature cocktails"`)

5. **`menuRefs`:** an array of `{file}:{line}` strings citing the menu source line(s) that verify the question. Less strict than Story 2.1's "one ref per item" — for `items-in-dish` a single ref to the dish line is enough (all ingredients are listed inline there); for `items-gf` and `items-in-section` cite each correctSet item's line.

6. **GF correctness is strict:** an item is gluten-free only if explicitly marked `*GF*` in the menu source. Do NOT infer based on intuition (e.g., "wings probably aren't GF because of the breading" — don't make that call). The 7 confirmed GF items are:
   - Deviled Eggs (`menu_front.md:9`)
   - Stuffed Jalapenos (`menu_front.md:19`)
   - Mixed Greens Salad (`menu_front.md:88`)
   - Street Corn Bowl (`menu_front.md:101`)
   - Pork Tacos (`menu_front.md:116`)
   - Marinated Shrimp Tacos (`menu_front.md:119`)
   - Flourless Chocolate Cake (`menu_back.md:29`)

   GF correctSets MUST be drawn only from these 7. All other items count as non-GF.

7. **Item-naming convention** (carried from Story 2.1):
   - Tacos: `"Pork Tacos"`, `"Marinated Shrimp Tacos"`, `"Fish Tacos"` (not bare names)
   - Handhelds with appetizer/burger collisions: `"Reuben Handheld"` (vs `"Reuben Spring Roll"`), `"BBQ Pork Handheld"`, `"Grilled Chicken Handheld"`
   - For `items-in-dish` questions, ingredient names should match the menu's spelling where possible (e.g., `"Queso Fresco"` not `"queso"`)

8. **Build-time validation passes:** `npm run build` runs `scripts/validate-content.ts` which parses `speed-select.json` against `SpeedSelectPoolSchema`. Exit 0 required. (The validator already wires this — verified.)

## Tasks / Subtasks

- [x] **Task 1: Pre-work safety check**
  - [x] Working tree clean; on `main`; up to date
  - [x] Confirm `SpeedSelectQuestionSchema` exists; 199 tests pass
  - [x] Confirm `scripts/validate-content.ts` already registers `speed-select.json` → `SpeedSelectPoolSchema` (verified during spec creation)
  - [x] Create branch `story/2-2-speed-select-content`

- [x] **Task 2: Write `data/questions/speed-select.json` (40 questions)**
  - [x] Use the question list in Dev Notes as a starting point (40 pre-drafted)
  - [x] Vary correctSet size (1-5) across questions for replay variety
  - [x] Validate names against menu source; substitute alternates if any conflict

- [x] **Task 3: Verification pass**
  - [x] For each question, walk the correctSet and confirm:
    - For `items-in-dish`: the ingredient is listed in the dish's menu line
    - For `items-gf`: the item appears in the 7 confirmed-GF list above
    - For `items-in-section`: the item appears in the named section of the menu
  - [x] For each distractor (not-in-correctSet items), confirm it's a real menu item — drop and replace if invented
  - [x] Drop any question that can't be 100% verified

- [x] **Task 4: Build + test**
  - [x] `npm run build` — must exit 0 (content validation runs as prebuild)
  - [x] `npm test` — all 199 tests still pass

- [x] **Task 5: Commit + push**
  - [x] Two commits (JSON content + spec)
  - [x] Fast-forward main, push, delete branch

## Dev Notes

### Criteria-Type Distribution Rationale

- **items-in-dish (18):** the richest source of variety — many composite dishes with multiple listed ingredients. Distractors can be real ingredients from adjacent dishes.
- **items-gf (8):** limited by only 7 confirmed-GF items in the menu. Mix GF and non-GF items in each grid; vary which GF items appear.
- **items-in-section (14):** clear and unambiguous — items belong to sections by their menu placement. Distractors are items from other sections.

### Suggested 40-Question List (starting point — dev agent may refine)

**items-in-dish (18) — prompt: `"Pick what's in the {Dish Name}"`**

For each: grid of 5 items (a mix of dish's actual ingredients + distractor ingredients from other dishes). correctSet = the items actually in the named dish.

1. House Salad — items: [Cucumbers, Tomatoes, Carrots, Red Onions, Croutons] — correctSet: all 5 (ref: `menu_front.md:82`)
2. House Salad (mixed) — items: [Cucumbers, Tomatoes, Bacon, Croutons, Mashed Potatoes] — correctSet: [Cucumbers, Tomatoes, Croutons] (ref: `menu_front.md:82`)
3. Caesar Salad — items: [Romaine Lettuce, Croutons, Parmesan Cheese, Sauerkraut, Coleslaw] — correctSet: [Romaine Lettuce, Croutons, Parmesan Cheese] (ref: `menu_front.md:85`)
4. Reuben Spring Roll — items: [Corned Beef, Sauerkraut, Swiss Cheese, Cheddar Cheese, Pulled Pork] — correctSet: [Corned Beef, Sauerkraut, Swiss Cheese] (ref: `menu_front.md:12`)
5. Nachos — items: [Black Beans, Queso Fresco, Lime Crema, Pita, Hot Honey] — correctSet: [Black Beans, Queso Fresco, Lime Crema] (ref: `menu_front.md:15`)
6. Stuffed Jalapenos — items: [Cheddar Cheese, Bacon, Hot Honey, Marie Rose Sauce, Swiss Cheese] — correctSet: [Cheddar Cheese, Bacon, Hot Honey] (ref: `menu_front.md:19`)
7. Chipotle Lime Flatbread — items: [Chicken, Cheddar Cheese, Avocado, Lime Crema, Pickled Red Onion] — correctSet: [Chicken, Cheddar Cheese, Avocado, Lime Crema] (ref: `menu_front.md:31`)
8. Hummus Board — items: [Roasted Red Peppers, Halloumi Cheese, Pita, Bacon, Croutons] — correctSet: [Roasted Red Peppers, Halloumi Cheese, Pita] (ref: `menu_front.md:37`)
9. Street Corn Bowl — items: [Grilled Chicken, Avocado, Roasted Corn, Queso Fresco, Brown Gravy] — correctSet: [Grilled Chicken, Avocado, Roasted Corn, Queso Fresco] (ref: `menu_front.md:101`)
10. Chicken Power Bowl — items: [Grilled Chicken, Chickpeas, Avocado, Peanut Vinaigrette, Carrots] — correctSet: [Grilled Chicken, Chickpeas, Avocado, Peanut Vinaigrette] (ref: `menu_front.md:104`)
11. Pork Tacos — items: [Pulled Pork, Pineapple, Queso Fresco, Avocado, Pico De Gallo] — correctSet: [Pulled Pork, Pineapple, Queso Fresco] (ref: `menu_front.md:116`)
12. Marinated Shrimp Tacos — items: [Pico De Gallo, Lettuce, Guacamole, Queso Fresco, Pineapple] — correctSet: [Pico De Gallo, Lettuce, Guacamole, Queso Fresco] (ref: `menu_front.md:119`)
13. All American Burger — items: [Lettuce, Tomato, American Cheese, Bacon, Pickled Red Onion] — correctSet: [Lettuce, Tomato, American Cheese, Bacon] (ref: `menu_front.md:131`)
14. The Steakhouse Burger — items: [Onion Ring, Fresh Mozzarella, BBQ Sauce, Au Jus, Provolone] — correctSet: [Onion Ring, Fresh Mozzarella, BBQ Sauce] (ref: `menu_front.md:134`)
15. Bacon and Egg Burger — items: [Cheddar Cheese, Bacon, Sunny Side Up Egg, Lettuce, Tomato Jam] — correctSet: [Cheddar Cheese, Bacon, Sunny Side Up Egg, Lettuce] (ref: `menu_front.md:140`)
16. The Dubliner Burger — items: [Cheddar Cheese, Rasher, Tomato Jam, Onion Ring, Avocado] — correctSet: [Cheddar Cheese, Rasher, Tomato Jam] (ref: `menu_front.md:143`)
17. Salmon BLT Wrap — items: [Grilled Salmon, Bacon, Romaine, Chipotle Mayo, Couscous] — correctSet: [Grilled Salmon, Bacon, Romaine, Chipotle Mayo] (ref: `menu_front.md:154`)
18. Shepherd's Pie — items: [Beef, Carrots, Brown Gravy, Peas, Couscous] — correctSet: [Beef, Carrots, Brown Gravy, Peas] (ref: `menu_back.md:10`)

**items-gf (8) — prompt: `"Pick what's gluten-free"`**

Each grid mixes GF items with non-GF items. correctSet = the GF subset.

19. items: [Deviled Eggs, Stuffed Jalapenos, Nachos, Reuben Spring Roll, Mixed Greens Salad] — correctSet: [Deviled Eggs, Stuffed Jalapenos, Mixed Greens Salad] — refs: `menu_front.md:9,19,88`
20. items: [Street Corn Bowl, Pork Tacos, Fish Tacos, Marinated Shrimp Tacos, Chicken Power Bowl] — correctSet: [Street Corn Bowl, Pork Tacos, Marinated Shrimp Tacos] — refs: `menu_front.md:101,116,119`
21. items: [Flourless Chocolate Cake, New York Cheesecake, S'mores Dip, Deviled Eggs, Buffalo Chicken Dip] — correctSet: [Flourless Chocolate Cake, Deviled Eggs] — refs: `menu_back.md:29`, `menu_front.md:9`
22. items: [House Salad, Caesar Salad, Mixed Greens Salad, Southwest Salad, Pork Tacos] — correctSet: [Mixed Greens Salad, Pork Tacos] — refs: `menu_front.md:88,116`
23. items: [Stuffed Jalapenos, Chicken Tenders, BBQ Chicken Flatbread, Chipotle Lime Flatbread, Marinated Shrimp Tacos] — correctSet: [Stuffed Jalapenos, Marinated Shrimp Tacos] — refs: `menu_front.md:19,119`
24. items: [Deviled Eggs, Stuffed Jalapenos, Mixed Greens Salad, Street Corn Bowl, Pork Tacos] — correctSet: all 5 — refs: `menu_front.md:9,19,88,101,116`
25. items: [Chicken Power Bowl, Grilled Salmon Bowl, Street Corn Bowl, Fish Tacos, Pork Tacos] — correctSet: [Street Corn Bowl, Pork Tacos] — refs: `menu_front.md:101,116`
26. items: [Buffalo Chicken Dip, Nachos, Reuben Spring Roll, Baked Pretzel Bites, Stuffed Jalapenos] — correctSet: [Stuffed Jalapenos] (1-of-5 case) — refs: `menu_front.md:19`

**items-in-section (14) — prompt: `"Pick the {section}"`**

Each grid: 5 items, some from the named section + some distractors from other sections.

27. Tacos — items: [Pork Tacos, Marinated Shrimp Tacos, Fish Tacos, Salmon BLT Wrap, Cheesesteak] — correctSet: [Pork Tacos, Marinated Shrimp Tacos, Fish Tacos] — refs: `menu_front.md:116,119,122`
28. Pub Burgers — items: [All American Burger, The Steakhouse, Kildares Pub Burger, Bacon and Egg, The Dubliner] — correctSet: all 5 — refs: `menu_front.md:131,134,137,140,143`
29. Desserts — items: [Flourless Chocolate Cake, New York Cheesecake, S'mores Dip, Mac & Cheese, Baked Pretzel Bites] — correctSet: [Flourless Chocolate Cake, New York Cheesecake, S'mores Dip] — refs: `menu_back.md:29,32,35`
30. Fry Baskets — items: [Basket of Fries, Loaded Fries, Old Bay Fries, Sweet Potato Fries, Brisket Fries] — correctSet: all 5 — refs: `menu_front.md:61,64,67,70,73`
31. Salads — items: [House Salad, Caesar Salad, Mixed Greens Salad, Southwest Salad, Hummus Board] — correctSet: [House Salad, Caesar Salad, Mixed Greens Salad, Southwest Salad] — refs: `menu_front.md:82,85,88,91`
32. Bowls — items: [Street Corn Bowl, Chicken Power Bowl, Grilled Salmon Bowl, Fish Tacos, Bangers and Mash] — correctSet: [Street Corn Bowl, Chicken Power Bowl, Grilled Salmon Bowl] — refs: `menu_front.md:101,104,107`
33. Entrees — items: [Steak Frites, Shepherd's Pie, Bangers and Mash, Reuben Handheld, Chicken Power Bowl] — correctSet: [Steak Frites, Shepherd's Pie, Bangers and Mash] — refs: `menu_back.md:7,10,22`
34. Handhelds — items: [Salmon BLT Wrap, Reuben Handheld, BBQ Pork Handheld, Grilled Chicken Handheld, Steak Frites] — correctSet: [Salmon BLT Wrap, Reuben Handheld, BBQ Pork Handheld, Grilled Chicken Handheld] — refs: `menu_front.md:154,157,160,163`
35. Shareables — items: [Deviled Eggs, Reuben Spring Roll, Nachos, Buffalo Chicken Dip, Pork Tacos] — correctSet: [Deviled Eggs, Reuben Spring Roll, Nachos, Buffalo Chicken Dip] — refs: `menu_front.md:9,12,15,25`
36. Sides (A Wee Bit More) — items: [Mac & Cheese, Coleslaw, Mashed Potatoes, Sauteed Mushrooms, Pork Tacos] — correctSet: [Mac & Cheese, Coleslaw, Mashed Potatoes, Sauteed Mushrooms] — refs: `menu_back.md:42,44,45,46`
37. Signature Cocktails — items: [Espresso Martini, Gin Hibiscus Spritz, Kildares Old Fashioned, Dragonfruit Mojito, Pinot Noir] — correctSet: [Espresso Martini, Gin Hibiscus Spritz, Kildares Old Fashioned, Dragonfruit Mojito] — refs: `menu_back.md:56,59,62,68`
38. Soups — items: [French Onion Soup, Beef and Chorizo Chili, Hummus Board, BBQ Chicken Flatbread, Sweet Potato Fries] — correctSet: [French Onion Soup, Beef and Chorizo Chili] — refs: `menu_front.md:54,55`
39. Pub Burgers (mixed) — items: [All American Burger, The Dubliner, Reuben Handheld, BBQ Pork Handheld, Grilled Chicken Handheld] — correctSet: [All American Burger, The Dubliner] — refs: `menu_front.md:131,143`
40. Desserts (mixed) — items: [New York Cheesecake, S'mores Dip, Mac & Cheese, Sweet Potato Fries, Pork Tacos] — correctSet: [New York Cheesecake, S'mores Dip] — refs: `menu_back.md:32,35`

### Sample JSON Entry

```json
{
  "prompt": "Pick what's in the House Salad",
  "criteriaType": "items-in-dish",
  "items": ["Cucumbers", "Tomatoes", "Bacon", "Croutons", "Mashed Potatoes"],
  "correctSet": ["Cucumbers", "Tomatoes", "Croutons"],
  "menuRefs": ["menu_front.md:82"]
}
```

### Common LLM Mistakes to Avoid

- **Do NOT** invent ingredients or claim items are GF without a `*GF*` tag in the source. The 7-item GF whitelist in AC #6 is the entire universe of GF correctSet entries.
- **Do NOT** include distractor strings that aren't real menu items (FR21). Every item in the 5-item grid must be findable on the menu.
- **Do NOT** make the items grid order match the correctSet order — speed-select displays the 5 items in a grid (Story 2.6 / QuestionSelect component), not as a list. Order of items in the JSON is just authoring; display order is the component's concern.
- **Do NOT** use bare ambiguous names like `"Reuben"` (could be Spring Roll OR Handheld) or `"Pork"` (could be Tacos OR Handheld OR BBQ Pork). Qualify.
- **Do NOT** include the same item twice in the `items` array. Schema doesn't catch this (refines are on correctSet), but it'd render two identical squares in the grid.
- **Do NOT** make every correctSet 3-of-5. Vary 1, 2, 3, 4, 5 across questions for replay variety.

### Verification Approach

For each question after writing:
1. Read the prompt — is it unambiguous?
2. For each item in `correctSet`, confirm it's verifiable on the menu line cited in `menuRefs`
3. For each item NOT in `correctSet`, confirm it's a real menu item (anywhere — not necessarily on the same line)
4. Confirm `items` length is exactly 5, no duplicates
5. Confirm `correctSet ⊆ items` (schema enforces but eyeball anyway)

### Previous Story Intelligence

**From Story 2.1 (Speed Type A content):**
- Menu-first ledger workflow already established; same approach here.
- Item-naming convention (`"Pork Tacos"`, `"Reuben Handheld"`, etc.) carried over.
- `scripts/validate-content.ts` already registers `speed-select.json` → `SpeedSelectPoolSchema` (verified during spec creation).

**From Story 1.4 (MC content):**
- Authoring-time verification, not deferred. Drop content that can't be verified.

### Git Intelligence

Last 4 commits on main:

```
e386eab Fix FeedbackOverlay: fade-in animation + remove delayed NEXT button
9592cff Fix MC reveal: asymmetric duration — wrong answers get 3000ms
c6d652a Fix MC reveal: remove obscuring ✓ overlay on correct answer
b3a87c4 Add Story 2.1 dev spec to planning artifacts
```

Story 2.2 builds on `e386eab`.

### Latest Tech Information

No new dependencies. Reuses Zod schemas + the existing `validate-content.ts` validator.

### Project Structure Notes

**Alignment with architecture:**
- `data/questions/speed-select.json` ✓ (architecture line 451)
- Schema in `src/lib/schemas/question.schema.ts` ✓ (already exists)
- `menuRefs` array preserved (auditability)

### References

- **Story source:** `_bmad-output/planning-artifacts/epics.md` § "Epic 2, Story 2.2"
- **PRD FRs:** FR19 (5 items grid), FR20 (3 criteria types), FR21 (distractors must be real menu items; correctSet 1-5), FR22 (select/deselect), FR23 (15s timer), FR24 (exact-match scoring), FR53 (JSON at `data/questions/`)
- **PRD content-quality override:** `.decision-log.md` § "2026-05-23 — Post-finalize override: content quality bar raised"
- **Schema:** `src/lib/schemas/question.schema.ts` lines 68–102
- **Menu sources:** `data/menu_front.md`, `data/menu_back.md`
- **Validator:** `scripts/validate-content.ts`

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code)

### Debug Log References

None — all 40 candidate questions from the spec passed verification on first pass.

### Completion Notes List

- `data/questions/speed-select.json` written with **40 questions** (18 items-in-dish + 8 items-gf + 14 items-in-section).
- **Validation audits (all 0 violations):**
  - 40/40 schema-pass
  - All 40 have exactly 5 items
  - No correctSet entries outside the items array (schema-enforced + double-checked)
  - No duplicate correctSet entries
  - No duplicate items within any question
  - All 8 GF questions' correctSets drawn exclusively from the 7-item whitelist
- **correctSet size distribution:** 1 (×1), 2 (×7), 3 (×15), 4 (×13), 5 (×4) — good replay variety, includes both the FR21 minimum (1) and maximum (5) cases.
- **Spot checks confirmed:** 5 randomly-sampled `items-in-dish` questions verified against the menu source (House Salad, Nachos, Street Corn Bowl, Salmon BLT Wrap, Shepherd's Pie). All correctSet ingredients found in their dish lines.
- **Naming conventions** consistent with Story 2.1: Tacos qualified ("Pork Tacos"), Handhelds qualified where ambiguous ("Reuben Handheld" vs "Reuben Spring Roll").
- **199 tests still pass** (no behavior change — pure content addition).
- **Bundle unchanged** at 465.58 / 138.14 kB — speed-select.json isn't imported by App.tsx yet; Story 2.3 will wire it in via the extended question selector.

### File List

- **NEW** `data/questions/speed-select.json`

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-24 | Story created. 40 candidate questions pre-drafted across 3 criteria types (18 items-in-dish, 8 items-gf, 14 items-in-section). GF whitelist (7 items) inlined to prevent hallucinations. Item-naming conventions carried from Story 2.1. | bmad-create-story (Claude Opus 4.7) |
| 2026-05-24 | Story shipped. 40 questions authored, schema-validated, all audits pass (0 violations across items.length / correctSet-subset / dupes / GF-whitelist). correctSet sizes span 1-5 for variety. Bundle unchanged — tree-shaken until Story 2.3's selector. | bmad-dev-story (Claude Opus 4.7) |
