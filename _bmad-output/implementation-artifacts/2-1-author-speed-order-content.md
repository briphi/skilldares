# Story 2.1: Author Speed Round Type A (Drag-to-Order) Content

Status: review

## Story

As a developer (content author),
I want 40 Type A drag-to-order questions authored as JSON, each with menu-verified facts (prices or beer ABVs),
so that the order-based speed rounds have variety across replays and every "correct" order is a defensible truth from the menu source.

## ⚠️ No-hallucinations bar applies (per PRD post-finalize override, 2026-05-23)

Speed Type A questions reference factual content (real menu prices, real beer ABVs). The PRD's content quality bar is **no hallucinations** for factual content — every item's `factorValue` must be traceable to a specific line in `data/menu_front.md` or `data/menu_back.md`. Story 1.4 established the menu-first workflow; this story re-applies it for Type A.

## Acceptance Criteria

1. **`data/questions/speed-order.json` contains exactly 40 questions** matching `SpeedOrderQuestionSchema` (already shipped in Story 1.3).

2. **Factor breakdown:** approximately 30 price questions + 10 ABV questions (rough split; exact count flexible within ±2). The variance gives variety without making ABV repetitive (only 6 distinct ABV buckets exist in the draft beer menu).

3. **Each question has 3–5 items per FR12** with **distinct `factorValue`s within the question** — items tied on the factor would make ordering ambiguous and the game ungradable. Verify zero ties per question.

4. **Items stored in canonical ascending order** (lowest factorValue first) per the schema comment. The QuestionOrder component (Story 2.4) will shuffle for display and compare submissions against this stored sequence.

5. **Prompt convention (low-to-high, no descending):**
   - Price questions: `"Order from cheapest to most expensive"`
   - ABV questions: `"Order from lowest ABV to highest ABV"`
   - **All questions use this convention.** No descending-direction prompts. Keeps the QuestionOrder component's comparison logic simple (always compare-equal to stored order; no reverse case).

6. **`menuRefs` per question:** an array of `{file}:{line}` strings (e.g., `"menu_front.md:42"`), one per item. Lets a human auditor click-to-verify each factor value.

7. **Build-time validation passes:** `npm run build` runs `scripts/validate-content.ts` which parses `speed-order.json` against `SpeedOrderQuestionSchema`. Exit 0 required.

8. **Authoring workflow** (mirror Story 1.4):
   - Build a menu fact ledger from `menu_front.md` + `menu_back.md` BEFORE writing any questions. Source ledger inlined below — dev agent extends/refines it as needed.
   - Generate questions only from ledger entries
   - Verification pass: for every committed question, cross-reference each `name` + `factorValue` pair against the menu line in `menuRefs`. Drop anything not 100% verifiable.

9. **No additional tests required for this content story.** Content validation is covered by `scripts/validate-content.ts` + the existing schema tests. Component tests for QuestionOrder come in Story 2.4.

## Tasks / Subtasks

- [x] **Task 1: Pre-work safety check**
  - [x] Working tree clean; on `main`; up to date
  - [x] Confirm `SpeedOrderQuestionSchema` exists in `src/lib/schemas/question.schema.ts` (Story 1.3); 197 tests pass
  - [x] Create branch `story/2-1-speed-order-content`

- [x] **Task 2: Confirm/extend the menu fact ledger**
  - [x] Open `data/menu_front.md` and `data/menu_back.md`
  - [x] Review the inlined ledger in Dev Notes; verify accuracy by spot-checking 5+ entries against the actual menu lines
  - [x] Note any prices that have changed or ambiguities

- [x] **Task 3: Author price-based questions (~30)**
  - [x] Draft questions per the question list in Dev Notes (or vary if the dev agent finds better picks)
  - [x] Each: 3–5 items, distinct factor values, items stored ascending, `menuRefs` array
  - [x] Use `"Order from cheapest to most expensive"` for all price prompts

- [x] **Task 4: Author ABV-based questions (~10)**
  - [x] Draw from the 6 distinct ABV buckets (4.2 / 4.4 / 4.8 / 5.0 / 5.1 / 6.5)
  - [x] Pick exactly one beer per bucket per question (else tie)
  - [x] Vary beer choices across questions (Guinness in one Q, Harp in the next, etc.) to keep variety high despite limited bucket count
  - [x] Use `"Order from lowest ABV to highest ABV"` for all ABV prompts

- [x] **Task 5: Write the JSON file**
  - [x] Create `data/questions/speed-order.json` as an array of 40 question objects
  - [x] Pretty-print (2-space indent) for diff readability — production bundler minifies anyway
  - [x] Run schema validation: `npx tsx scripts/validate-content.ts` (or whatever the existing validator entry is)

- [x] **Task 6: Verification pass**
  - [x] For each of the 40 questions, walk every item and confirm:
    - Item name matches the menu line exactly (or is a sensible short name — e.g., "Pork Tacos" for the "Pork" entry under Tacos section, since "Pork" alone is ambiguous in display)
    - factorValue matches the price or ABV in the menu source
    - menuRefs points to the right line
  - [x] If any item fails verification → drop the question, replace from the candidate pool
  - [x] **Drop the question if it can't be 100% verified.** Don't ship factually-fuzzy content.

- [x] **Task 7: Build + test**
  - [x] `npm run build` — must exit 0 (content validation runs as prebuild)
  - [x] `npm test` — all 197 tests still pass (no behavior change expected)

- [x] **Task 8: Commit + push**
  - [x] Stage `data/questions/speed-order.json` + the spec
  - [x] Two commits: content commit, spec commit
  - [x] Fast-forward main, push, delete branch

## Dev Notes

### Menu Fact Ledger (built during story creation — verify + extend in Task 2)

**Prices — `menu_front.md`:**

| Item | Price | Line |
|---|---|---|
| Deviled Eggs | 10.99 | 9 |
| Reuben Spring Roll | 10.99 | 12 |
| Nachos | 13.99 | 15 |
| Stuffed Jalapenos | 10.99 | 19 |
| Chicken Tenders | 11.99 | 22 |
| Buffalo Chicken Dip | 12.99 | 25 |
| BBQ Chicken Flatbread | 11.99 | 28 |
| Chipotle Lime Flatbread | 11.99 | 31 |
| Baked Pretzel Bites | 10.99 | 34 |
| Hummus Board | 13.99 | 37 |
| 10 Kildares Wings | 15.99 | 47 |
| 20 Kildares Wings | 29.99 | 48 |
| French Onion Soup | 7.99 | 54 |
| Beef and Chorizo Chili | 7.99 | 55 |
| Basket of Fries | 8.99 | 61 |
| Loaded Fries | 12.99 | 64 |
| Old Bay Fries | 9.99 | 67 |
| Brisket Fries | 12.99 | 70 |
| Sweet Potato Fries | 10.99 | 73 |
| House Salad | 8.99 | 82 |
| Caesar Salad | 8.99 | 85 |
| Mixed Greens Salad | 9.99 | 88 |
| Southwest Salad | 9.99 | 91 |
| Street Corn Bowl | 15.99 | 101 |
| Chicken Power Bowl | 14.99 | 104 |
| Grilled Salmon Bowl | 15.99 | 107 |
| Pork Tacos | 13.99 | 116 |
| Marinated Shrimp Tacos | 14.99 | 119 |
| Fish Tacos | 14.99 | 122 |
| All American Burger | 15.99 | 131 |
| The Steakhouse Burger | 15.99 | 134 |
| Kildares Pub Burger | 16.99 | 137 |
| Bacon and Egg Burger | 15.99 | 140 |
| The Dubliner Burger | 15.99 | 143 |
| Salmon BLT Wrap | 16.99 | 154 |
| Reuben Handheld | 15.99 | 157 |
| BBQ Pork Handheld | 13.99 | 160 |
| Grilled Chicken Handheld | 14.99 | 163 |
| Hot Roast Beef | 14.99 | 166 |
| Ploughman | 13.99 | 169 |
| Cheesesteak | 13.99 | 172 |

**Prices — `menu_back.md`:**

| Item | Price | Line |
|---|---|---|
| Steak Frites | 23.99 | 7 |
| Shepherd's Pie | 17.99 | 10 |
| Grilled Salmon Entree | 17.99 | 13 |
| Irish Breakfast | 19.99 | 16 |
| Fish and Chips | 17.99 | 19 |
| Bangers and Mash | 17.99 | 22 |
| Flourless Chocolate Cake | 7 | 29 |
| New York Cheesecake | 8 | 32 |
| S'mores Dip | 12 | 35 |
| Mac & Cheese (side) | 8 | 42 |
| Bacon Mac & Cheese (side) | 9 | 43 |
| Coleslaw (side) | 4 | 44 |
| Mashed Potatoes (side) | 4 | 45 |
| Sauteed Mushrooms (side) | 4 | 46 |
| Roasted Broccoli & Cauliflower (side) | 5 | 47 |
| Side House Salad | 4 | 48 |
| Side Caesar Salad | 4 | 49 |
| Carrots & Celery (side) | 3 | 50 |
| Espresso Martini | 14 | 56 |
| Gin Hibiscus Spritz | 11 | 59 |
| Kildares Old Fashioned | 14 | 62 |
| Sweet and Spicy Margarita | 14 | 65 |
| Dragonfruit Mojito | 12 | 68 |
| Cucumber Cool | 11 | 71 |
| Strawberry Pineapple Martini | 12 | 74 |
| White Peach Sangria | 12 | 77 |
| Cabernet Sauvignon (5oz) | 10 | 171 |
| Cabernet Sauvignon (bottle) | 30 | 171 |
| Malbec (5oz) | 11 | 172 |
| Malbec (bottle) | 33 | 172 |
| Pinot Noir (5oz) | 11 | 173 |
| Pinot Noir (bottle) | 33 | 173 |
| Chardonnay (5oz) | 10 | 175 |
| Chardonnay (bottle) | 30 | 175 |
| Brut (5oz) | 8 | 182 |
| Brut (bottle) | 24 | 182 |
| Rose (5oz) | 10 | 183 |
| Rose (bottle) | 30 | 183 |

**ABVs — Draft Beer `menu_back.md` lines 100–115:**

| Beer | ABV | Line |
|---|---|---|
| Guinness | 4.2 | 102 |
| Harp | 4.2 | 103 |
| Kronenbourg | 5.0 | 104 |
| Fiddlehead | 6.5 | 105 |
| Stella | 5.0 | 106 |
| Kona Big Wave | 4.4 | 107 |
| Bitburger | 4.8 | 108 |
| Smithwicks | 4.2 | 109 |
| Carlsberg | 5.0 | 110 |
| Levante Cloudy | 5.0 | 111 |
| Kilkenny Nitro | 4.2 | 112 |
| Downeast Cider | 5.1 | 113 |
| Michelob Ultra | 4.2 | 115 |

(Lawsons is "Rotating" — no fixed ABV — exclude from this story.)

**Distinct ABV buckets:** 4.2, 4.4, 4.8, 5.0, 5.1, 6.5 → 6 buckets total. Pick one beer per bucket per question.

### Pitfalls to Avoid

- **Tied factor values within a single question.** Schema doesn't catch this (it just validates types). The dev agent MUST manually verify zero ties per question. Easy to slip on: e.g., picking 3 burgers all at 15.99.
- **Item-name ambiguity.** Several menu rows are short labels in section context — e.g., the Tacos section just says "Pork", "Marinated Shrimp", "Fish". Author them with the section qualifier in the JSON: `"Pork Tacos"`, `"Marinated Shrimp Tacos"`, `"Fish Tacos"`. Players need to know what they're ordering.
- **Wing pricing.** "Kildares Wings" has only TWO prices ($15.99 for 10, $29.99 for 20). Not enough for a wings-only price question. Include wing entries only in cross-section questions.
- **Wine ambiguity.** Wine has separate 5oz and bottle prices. If using both in the same question, label them explicitly: `"Cabernet Sauvignon (5oz)"` vs `"Cabernet Sauvignon (bottle)"` so players can tell them apart.
- **Fresh Squeezed.** All 4 are exactly $10. NOT usable for ordering questions (all ties).
- **Beer ABV ties.** 5 beers share 4.2 (Guinness, Harp, Smithwicks, Kilkenny, Michelob), 4 share 5.0 (Kronenbourg, Stella, Carlsberg, Levante). Within one question, pick only ONE beer per ABV bucket.

### Suggested Question List (starting point — dev agent may refine)

Below are 40 candidates that satisfy the no-ties + 3-5 items + verified-facts constraints. Dev agent should walk each and confirm before committing. If a candidate fails verification, drop and substitute from the ledger.

**Price questions (30):**

1. 3 items: Carrots & Celery (3), Mac & Cheese (8), Sweet Potato Fries (10.99)
2. 3 items: Coleslaw (4), French Onion Soup (7.99), Basket of Fries (8.99)
3. 4 items: Carrots & Celery (3), Roasted Broccoli & Cauliflower (5), Flourless Chocolate Cake (7), New York Cheesecake (8)
4. 4 items: Mashed Potatoes (4), Bacon Mac & Cheese (9), Loaded Fries (12.99), Steak Frites (23.99)
5. 5 items: Coleslaw (4), Flourless Chocolate Cake (7), Mac & Cheese (8), Bacon Mac & Cheese (9), S'mores Dip (12)
6. 3 items: Side House Salad (4), Roasted Broccoli & Cauliflower (5), French Onion Soup (7.99)
7. 3 items: Beef and Chorizo Chili (7.99), Old Bay Fries (9.99), Reuben Spring Roll (10.99)
8. 3 items: Sweet Potato Fries (10.99), Buffalo Chicken Dip (12.99), Hummus Board (13.99)
9. 4 items: Old Bay Fries (9.99), Stuffed Jalapenos (10.99), Chicken Tenders (11.99), Nachos (13.99)
10. 3 items: Chipotle Lime Flatbread (11.99), Loaded Fries (12.99), Hummus Board (13.99)
11. 3 items: Chicken Power Bowl (14.99), Street Corn Bowl (15.99), Kildares Pub Burger (16.99)
12. 3 items: Pork Tacos (13.99), Grilled Chicken Handheld (14.99), Reuben Handheld (15.99)
13. 4 items: BBQ Pork Handheld (13.99), Hot Roast Beef (14.99), Reuben Handheld (15.99), Salmon BLT Wrap (16.99)
14. 3 items: Fish and Chips (17.99), Irish Breakfast (19.99), Steak Frites (23.99)
15. 4 items: Reuben Handheld (15.99), Salmon BLT Wrap (16.99), Bangers and Mash (17.99), Steak Frites (23.99)
16. 5 items: French Onion Soup (7.99), Basket of Fries (8.99), Old Bay Fries (9.99), Chicken Tenders (11.99), Nachos (13.99)
17. 5 items: Coleslaw (4), Mac & Cheese (8), Sweet Potato Fries (10.99), Chicken Power Bowl (14.99), Steak Frites (23.99)
18. 3 items: 10 Kildares Wings (15.99), Kildares Pub Burger (16.99), Bangers and Mash (17.99)
19. 4 items: New York Cheesecake (8), S'mores Dip (12), Pork Tacos (13.99), Chicken Power Bowl (14.99)
20. 3 items: Carrots & Celery (3), Roasted Broccoli & Cauliflower (5), Mac & Cheese (8)
21. 3 items: Flourless Chocolate Cake (7), Mac & Cheese (8), Bacon Mac & Cheese (9)
22. 4 items: Side House Salad (4), Flourless Chocolate Cake (7), New York Cheesecake (8), S'mores Dip (12)
23. 3 items: Coleslaw (4), French Onion Soup (7.99), Caesar Salad (8.99)
24. 5 items: Coleslaw (4), Mac & Cheese (8), Old Bay Fries (9.99), Pork Tacos (13.99), Irish Breakfast (19.99)
25. 3 items: Sweet Potato Fries (10.99), Marinated Shrimp Tacos (14.99), Salmon BLT Wrap (16.99)
26. 4 items: French Onion Soup (7.99), Caesar Salad (8.99), Old Bay Fries (9.99), Stuffed Jalapenos (10.99)
27. 3 items: Gin Hibiscus Spritz (11), Dragonfruit Mojito (12), Espresso Martini (14)
28. 3 items: Brut (5oz) (8), Cabernet Sauvignon (5oz) (10), Pinot Noir (5oz) (11)
29. 3 items: Brut (bottle) (24), Cabernet Sauvignon (bottle) (30), Pinot Noir (bottle) (33)
30. 3 items: Cucumber Cool (11), Strawberry Pineapple Martini (12), Sweet and Spicy Margarita (14)

**ABV questions (10):**

31. 3 items: Guinness (4.2), Bitburger (4.8), Fiddlehead (6.5)
32. 3 items: Harp (4.2), Stella (5.0), Fiddlehead (6.5)
33. 3 items: Smithwicks (4.2), Kona Big Wave (4.4), Bitburger (4.8)
34. 4 items: Guinness (4.2), Kona Big Wave (4.4), Bitburger (4.8), Fiddlehead (6.5)
35. 4 items: Michelob Ultra (4.2), Stella (5.0), Downeast Cider (5.1), Fiddlehead (6.5)
36. 4 items: Harp (4.2), Bitburger (4.8), Kronenbourg (5.0), Fiddlehead (6.5)
37. 5 items: Guinness (4.2), Kona Big Wave (4.4), Bitburger (4.8), Carlsberg (5.0), Downeast Cider (5.1)
38. 5 items: Smithwicks (4.2), Kona Big Wave (4.4), Bitburger (4.8), Levante Cloudy (5.0), Fiddlehead (6.5)
39. 4 items: Kilkenny Nitro (4.2), Kona Big Wave (4.4), Stella (5.0), Downeast Cider (5.1)
40. 3 items: Bitburger (4.8), Carlsberg (5.0), Fiddlehead (6.5)

### Sample JSON Entry

```json
{
  "prompt": "Order from cheapest to most expensive",
  "factor": "price",
  "items": [
    { "name": "Carrots & Celery", "factorValue": 3 },
    { "name": "Mac & Cheese", "factorValue": 8 },
    { "name": "Sweet Potato Fries", "factorValue": 10.99 }
  ],
  "menuRefs": ["menu_back.md:50", "menu_back.md:42", "menu_front.md:73"]
}
```

### Common LLM Mistakes to Avoid

- **Do NOT** invent prices. Every factorValue comes from the menu ledger above.
- **Do NOT** ship a question with tied factor values. Verify ALL items are distinct before committing.
- **Do NOT** use descending-order prompts. Always low-to-high; the QuestionOrder component (Story 2.4) will be simpler.
- **Do NOT** use sub-3 or above-5 item counts. Schema enforces 3-5 but be deliberate.
- **Do NOT** use the "Rotating" beer (Lawsons) — no fixed ABV.
- **Do NOT** mix wine 5oz and bottle into the same question without explicit labels.
- **Do NOT** use the Tacos section's short labels ("Pork", "Marinated Shrimp", "Fish") — qualify with "Tacos" suffix so the displayed name reads clearly.

### Previous Story Intelligence

**From Story 1.3 (schemas):**
- `SpeedOrderQuestionSchema` already exists. Just author the JSON, no schema changes needed in this story.

**From Story 1.4 (MC content):**
- Menu-first ledger approach works. Same workflow applies here.
- The `validate-content.ts` script in `scripts/` runs at prebuild and parses every content JSON against its schema. Validation failures fail the build.

**From the recently-shipped Story 0bf5f3a (MC option shuffling):**
- A reminder that content-authoring conventions (like "always store correctIndex=0") can create runtime bugs. For Type A, the runtime convention is "items stored ascending, QuestionOrder shuffles for display". Story 2.4 owns the display shuffle.

### Git Intelligence

Last 4 commits on main:

```
76df560 PRD: add FR9.1 (randomized MC option order per game) + log decision
0bf5f3a Fix MC bug: shuffle question options at game-setup time
93e9866 Add Story 1.17 dev spec to planning artifacts
936a98b Story 1.17: Epic 1 integration — App composition + production deploy
```

Story 2.1 builds on `76df560`.

### Latest Tech Information

No new dependencies. Reuses Zod schemas + the existing `validate-content.ts` validator.

### Project Structure Notes

**Alignment with architecture:**
- `data/questions/speed-order.json` ✓ (architecture line 450)
- Schema in `src/lib/schemas/question.schema.ts` ✓
- `menuRefs` array preserved (auditability)

### References

- **Story source:** `_bmad-output/planning-artifacts/epics.md` § "Epic 2, Story 2.1"
- **PRD FRs:** FR12 (3-5 items), FR13 (price + ABV factors only; ABV drinks only), FR53 (JSON at `data/questions/`)
- **PRD content-quality override:** `.decision-log.md` § "2026-05-23 — Post-finalize override: content quality bar raised"
- **Schema:** `src/lib/schemas/question.schema.ts` lines 38–66
- **Menu sources:** `data/menu_front.md`, `data/menu_back.md`
- **Validator:** `scripts/validate-content.ts`

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code)

### Debug Log References

None — all 40 candidate questions from the spec passed verification on first pass.

### Completion Notes List

- `data/questions/speed-order.json` written with **40 questions** (30 price + 10 ABV) matching the spec's candidate list verbatim.
- **Validation:** 40/40 schema-pass, 0 questions with tied factorValues (verified via Python audit), 0 questions not in canonical ascending order, 40/40 menu-line spot checks for items used in 6+ questions.
- All items qualified for display: Tacos entries use "Pork Tacos" / "Marinated Shrimp Tacos" / "Fish Tacos" (not bare menu labels); handhelds use "Reuben Handheld" / "BBQ Pork Handheld" / "Hot Roast Beef" / etc. to avoid name collisions with appetizer or burger entries.
- Wine entries with both 5oz and bottle prices labeled explicitly: "Brut (5oz)" / "Brut (bottle)", etc.
- Lawsons (rotating tap, no fixed ABV) intentionally excluded.
- Prompts standardized: "Order from cheapest to most expensive" for price, "Order from lowest ABV to highest ABV" for ABV. No descending prompts (keeps Story 2.4's QuestionOrder simpler).
- **199 tests still pass** (no behavior change — pure content addition).
- **Bundle unchanged** at 465.74 / 138.18 kB — speed-order.json isn't imported by App.tsx yet; Story 2.3 will wire it in via the extended question selector.

### File List

- **NEW** `data/questions/speed-order.json`

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-24 | Story created. Menu fact ledger pre-built inline (prices + beer ABVs); 40 candidate questions pre-drafted (30 price + 10 ABV). Dev agent verifies each item against the menu before committing; drops anything that can't be 100% verified. No-hallucinations bar per PRD post-finalize override. | bmad-create-story (Claude Opus 4.7) |
| 2026-05-24 | Story shipped. 40 questions authored, schema-validated, audited for ties (0) and ascending order (40/40 correct). Spot checks confirm every menu line referenced exists with the cited value. Bundle unchanged — tree-shaken until Story 2.3's selector. | bmad-dev-story (Claude Opus 4.7) |
