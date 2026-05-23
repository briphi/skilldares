# Story 1.3: Zod Schemas + Build-Time Content Validation

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want Zod schemas for all content types and a pre-build validation script,
so that malformed content fails the build before it can ever ship.

## Acceptance Criteria

1. **Zod schemas defined for all content types:**
   - `src/lib/schemas/question.schema.ts` exists and exports:
     - `MultipleChoiceQuestionSchema` (and inferred `MultipleChoiceQuestion` type)
     - `SpeedOrderQuestionSchema` (and inferred `SpeedOrderQuestion` type)
     - `SpeedSelectQuestionSchema` (and inferred `SpeedSelectQuestion` type)
     - `MultipleChoicePoolSchema`, `SpeedOrderPoolSchema`, `SpeedSelectPoolSchema` (pool-of-questions schemas)
   - Each question schema includes a `menuRefs: string[]` field
   - All TypeScript types are derived via `z.infer<typeof Schema>` — never hand-written separately
   - `src/lib/schemas/message.schema.ts` exists and exports `MessagePoolSchema` (array of non-empty strings) + `MessagePoolId` (the 8 known pool names as a Zod enum)

2. **Build-time content validation script works:**
   - `scripts/validate-content.ts` exists; loads every `.json` file in `data/questions/` and `data/messages/` if those directories exist, applies the correct Zod schema by filename convention (see Dev Notes), runs `.parse()`, exits 0 on success, exits 1 with clear errors on any failure
   - If `data/questions/` or `data/messages/` doesn't exist or is empty (which is the case right now — Stories 1.4-1.5 populate them), the script prints a friendly note and exits 0
   - `package.json` has a `"prebuild": "tsx scripts/validate-content.ts"` script

3. **Dependencies installed correctly:**
   - `zod` (latest 4.4.x) added as a runtime dependency
   - `tsx` (latest 4.x) added as a devDependency
   - `npm install` succeeds with no errors

4. **Build pipeline unaffected for current state:**
   - `npm run build` succeeds (the prebuild script runs first, finds no content, exits 0, then the regular build proceeds)
   - `npm test`... not yet (test framework is Story 1.6)
   - AWS Amplify build on push succeeds and the deployed site at `https://www.skilldares.com/` is byte-identical to before (no UI changes)

## Tasks / Subtasks

- [x] **Task 1: Pre-work safety check** (AC: #4)
  - [x] Working tree clean (only untracked: story doc + `notes`)
  - [x] On `main`, up to date with `origin/main`
  - [x] Verified `src/styles/global.css` exists, `src/main.tsx` imports `./styles/global.css`, `index.html` has Google Fonts link
  - [x] Created branch `story/1-3-schemas-validation`

- [x] **Task 2: Install new dependencies** (AC: #3)
  - [x] `npm install zod@^4.4.3 --save` succeeded — 0 vulnerabilities, lockfile updated
  - [x] `npm install tsx@^4.22.3 --save-dev` succeeded — 0 vulnerabilities, lockfile updated
  - [x] Verified `package.json` shows `zod: ^4.4.3` in dependencies, `tsx: ^4.22.3` in devDependencies
  - [x] No other dependencies changed (no accidental upgrades)

- [x] **Task 3: Create `src/lib/schemas/question.schema.ts`** (AC: #1)
  - [x] Created `src/lib/schemas/` directory (first file in `src/lib/`)
  - [x] Created `src/lib/schemas/question.schema.ts` with MultipleChoice + SpeedOrder + SpeedSelect schemas, refines, pool schemas, z.infer<> types — exact content from Dev Notes
  - [x] `npx tsc --noEmit` passed (exit 0)

- [x] **Task 4: Create `src/lib/schemas/message.schema.ts`** (AC: #1)
  - [x] Created `src/lib/schemas/message.schema.ts` with MessagePoolIdSchema (8 pool names) + MessagePoolSchema
  - [x] `npx tsc --noEmit` passed (exit 0) with both schema files present

- [x] **Task 5: Create `scripts/validate-content.ts`** (AC: #2)
  - [x] Created `scripts/` directory
  - [x] Created `scripts/validate-content.ts` matching Dev Notes content, with a small refinement: `validate()` now returns boolean so the per-file `✓ validated` line only prints on actual success (caught during Task 7 smoke testing — script was misleadingly printing ✓ before the failure summary)
  - [x] Script imports schemas correctly via relative path `../src/lib/schemas/...`

- [x] **Task 6: Add `prebuild` script to `package.json`** (AC: #2)
  - [x] Added `"prebuild": "tsx scripts/validate-content.ts"` to `package.json` scripts block
  - [x] Verified existing `"build": "tsc -b && vite build"` script unchanged

- [x] **Task 7: Smoke test the validation script** (AC: #2, #4)
  - [x] Empty case: `npx tsx scripts/validate-content.ts` exits 0, prints "No data/questions/ directory yet" + "No data/messages/ directory yet"
  - [x] Error case: garbage JSON triggers exit 1 with 5 detailed errors (prompt, options, correctIndex, funnyWrongIndex, menuRefs each "expected X, received undefined")
  - [x] Cleanup + re-run: back to empty case, exit 0
  - [x] Detected and fixed a cosmetic bug: script was printing `✓ validated` before the failure summary; fixed in Task 5 by making `validate()` return boolean

- [x] **Task 8: Verify the full build pipeline** (AC: #4)
  - [x] `npm run build` ran all three phases:
    1. `prebuild` → tsx validate-content.ts → empty case, exit 0
    2. `tsc -b` → strict-mode type-check, exit 0
    3. `vite build` → ✓ built in 88ms, dist/ produced
  - [x] Bundle sizes identical to pre-story (zod isn't imported by runtime code yet)
  - [x] Deployed UI will be byte-identical (no runtime change)

- [x] **Task 9: Commit + push** (AC: #4)
  - [x] Staged explicitly: `git add src/lib/ scripts/ package.json package-lock.json` (4 paths)
  - [x] Committed on `story/1-3-schemas-validation`: `99c46cb` (5 files changed, 807 insertions, 5 deletions)
  - [x] Fast-forwarded `main` from `3aabfcd` to `99c46cb`, pushed to `origin/main`
  - [x] Deleted merged `story/1-3-schemas-validation` branch locally

- [x] **Task 10: Verify production deploy** (AC: #4)
  - [x] Amplify build completed after push of `99c46cb`
  - [x] User confirmed: build log showed the prebuild step running cleanly, live site unchanged

## Dev Notes

### Project Background

This is **Story 1.3 of Epic 1**. Stories 1.1 (scaffold + Amplify) and 1.2 (tokens + fonts) are deployed to production. Story 1.3 adds the content-validation infrastructure: Zod schemas as the single source of truth for content shapes, and a pre-build script that enforces them.

**Why this story matters:** Content (≥200 MC questions + 80 speed questions + 370 messages) gets authored later by LLM in Stories 1.4, 1.5, 2.1, 2.2, 3.1 and dropped into `data/`. Without runtime validation, malformed content would either silently break the app or be caught only at runtime in front of a user. The schemas + pre-build validator make malformed content a build failure, never a production bug.

The full planning bundle lives in `_bmad-output/planning-artifacts/`. Previous story dev specs are in `_bmad-output/implementation-artifacts/`.

### Current Repository State (post-Story 1.2)

```
skilldares/
├── amplify.yml
├── eslint.config.js
├── index.html                  (Google Fonts + Skilldares title)
├── package.json                (skilldares, react, vite, no zod yet)
├── package-lock.json
├── tsconfig.app.json           (strict mode)
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── README.md
├── data/
│   ├── menu_front.md           (source-of-truth menu, untouched)
│   └── menu_back.md            (source-of-truth menu, untouched)
├── public/
├── src/
│   ├── App.css                 (counter-app CSS)
│   ├── App.tsx                 (counter app)
│   ├── assets/
│   ├── main.tsx                (imports ./styles/global.css)
│   └── styles/
│       └── global.css          (design tokens)
└── _bmad-output/, _bmad/, .claude/, docs/, .git/
```

Story 1.3 adds:

```
skilldares/
├── package.json                MODIFIED (add zod, tsx, prebuild script)
├── package-lock.json           MODIFIED (npm install)
├── scripts/
│   └── validate-content.ts     NEW
├── src/
│   └── lib/
│       └── schemas/
│           ├── question.schema.ts   NEW
│           └── message.schema.ts    NEW
```

NOTE: `data/questions/` and `data/messages/` directories do NOT exist yet. They are created (and populated) by Stories 1.4, 1.5, 2.1, 2.2, 3.1. The validation script in this story handles their absence gracefully.

### Exact Content for `src/lib/schemas/question.schema.ts`

```typescript
import { z } from 'zod';

/**
 * Skilldares — Question Schemas
 *
 * Single source of truth for content shapes. TypeScript types are derived
 * via z.infer<> — never hand-write a parallel interface.
 *
 * Content JSON lives in data/questions/{multiple-choice,speed-order,speed-select}.json
 * and is validated by scripts/validate-content.ts at build time.
 */

// ---------- Multiple Choice (rounds 1–15) ----------

export const MultipleChoiceQuestionSchema = z
  .object({
    prompt: z.string().min(1, 'prompt must not be empty'),
    options: z
      .array(z.string().min(1))
      .length(4, 'options must contain exactly 4 entries'),
    correctIndex: z.number().int().min(0).max(3),
    funnyWrongIndex: z.number().int().min(0).max(3),
    menuRefs: z.array(z.string().min(1)),
  })
  .refine((q) => q.funnyWrongIndex !== q.correctIndex, {
    message: 'funnyWrongIndex must differ from correctIndex',
    path: ['funnyWrongIndex'],
  });

export type MultipleChoiceQuestion = z.infer<typeof MultipleChoiceQuestionSchema>;

export const MultipleChoicePoolSchema = z
  .array(MultipleChoiceQuestionSchema)
  .min(1, 'pool must contain at least 1 question');

export type MultipleChoicePool = z.infer<typeof MultipleChoicePoolSchema>;

// ---------- Speed Type A — Drag-to-Order (rounds 16–30, ~50%) ----------

export const SpeedOrderFactorSchema = z.enum(['price', 'ABV']);
export type SpeedOrderFactor = z.infer<typeof SpeedOrderFactorSchema>;

export const SpeedOrderItemSchema = z.object({
  name: z.string().min(1),
  factorValue: z.number().nonnegative(),
});

export type SpeedOrderItem = z.infer<typeof SpeedOrderItemSchema>;

export const SpeedOrderQuestionSchema = z.object({
  prompt: z.string().min(1),
  factor: SpeedOrderFactorSchema,
  /**
   * Items in their CORRECT order (sorted by factorValue ascending if applicable
   * to the prompt — e.g., "cheapest first"). The app shuffles for display and
   * compares the user's submitted order against this canonical sequence.
   * 3–5 items per FR12.
   */
  items: z.array(SpeedOrderItemSchema).min(3).max(5),
  menuRefs: z.array(z.string().min(1)),
});

export type SpeedOrderQuestion = z.infer<typeof SpeedOrderQuestionSchema>;

export const SpeedOrderPoolSchema = z.array(SpeedOrderQuestionSchema).min(1);
export type SpeedOrderPool = z.infer<typeof SpeedOrderPoolSchema>;

// ---------- Speed Type B — Multi-Select (rounds 16–30, ~50%) ----------

export const SpeedSelectCriteriaTypeSchema = z.enum([
  'items-in-dish',
  'items-gf',
  'items-in-section',
]);
export type SpeedSelectCriteriaType = z.infer<typeof SpeedSelectCriteriaTypeSchema>;

export const SpeedSelectQuestionSchema = z
  .object({
    prompt: z.string().min(1),
    criteriaType: SpeedSelectCriteriaTypeSchema,
    /** Exactly 5 items shown in the grid (FR19). */
    items: z.array(z.string().min(1)).length(5),
    /**
     * Subset of `items` that satisfies the criteria. At least 1, up to all 5 (FR21).
     * Each entry MUST be one of the strings in `items` (enforced via refine).
     */
    correctSet: z.array(z.string().min(1)).min(1).max(5),
    menuRefs: z.array(z.string().min(1)),
  })
  .refine((q) => q.correctSet.every((c) => q.items.includes(c)), {
    message: 'correctSet entries must all appear in items',
    path: ['correctSet'],
  })
  .refine((q) => new Set(q.correctSet).size === q.correctSet.length, {
    message: 'correctSet must not contain duplicates',
    path: ['correctSet'],
  });

export type SpeedSelectQuestion = z.infer<typeof SpeedSelectQuestionSchema>;

export const SpeedSelectPoolSchema = z.array(SpeedSelectQuestionSchema).min(1);
export type SpeedSelectPool = z.infer<typeof SpeedSelectPoolSchema>;
```

### Exact Content for `src/lib/schemas/message.schema.ts`

```typescript
import { z } from 'zod';

/**
 * Skilldares — Message Pool Schemas
 *
 * Each pool is a JSON file in data/messages/ containing an array of non-empty
 * strings. The picker (FR38) selects a pool by ID, then a message uniform-random
 * from that pool.
 */

export const MessagePoolIdSchema = z.enum([
  'pre-game-encouragement',
  'right-no-streak',
  'wrong-no-streak',
  'on-fire',
  'doing-bad',
  'streak-broken',
  'comeback',
  'new-high-score',
]);

export type MessagePoolId = z.infer<typeof MessagePoolIdSchema>;

export const MessagePoolSchema = z
  .array(z.string().min(1, 'messages must not be empty strings'))
  .min(1, 'pool must contain at least 1 message');

export type MessagePool = z.infer<typeof MessagePoolSchema>;
```

### Exact Content for `scripts/validate-content.ts`

```typescript
/**
 * Skilldares — Build-time content validator.
 *
 * Run by `npm run prebuild` (i.e., automatically before `npm run build`).
 * Walks data/questions/ and data/messages/, validates each JSON file
 * against the appropriate Zod schema, exits 0 on success, 1 on any failure.
 *
 * If data/questions/ or data/messages/ does not exist (which is the case
 * before Stories 1.4-1.5 author content), the script prints a friendly note
 * and exits 0.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  MultipleChoicePoolSchema,
  SpeedOrderPoolSchema,
  SpeedSelectPoolSchema,
} from '../src/lib/schemas/question.schema';
import {
  MessagePoolIdSchema,
  MessagePoolSchema,
} from '../src/lib/schemas/message.schema';
import type { ZodType } from 'zod';

const QUESTIONS_DIR = join(process.cwd(), 'data', 'questions');
const MESSAGES_DIR = join(process.cwd(), 'data', 'messages');

const QUESTION_SCHEMAS: Record<string, ZodType> = {
  'multiple-choice.json': MultipleChoicePoolSchema,
  'speed-order.json': SpeedOrderPoolSchema,
  'speed-select.json': SpeedSelectPoolSchema,
};

interface ValidationFailure {
  file: string;
  message: string;
}

function exists(path: string): boolean {
  try {
    statSync(path);
    return true;
  } catch {
    return false;
  }
}

function listJsonFiles(dir: string): string[] {
  if (!exists(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.json'));
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function validate(
  schema: ZodType,
  data: unknown,
  filePath: string,
  failures: ValidationFailure[],
): void {
  const result = schema.safeParse(data);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const pathStr = issue.path.length > 0 ? issue.path.join('.') : '(root)';
      failures.push({
        file: filePath,
        message: `[${pathStr}] ${issue.message}`,
      });
    }
  }
}

function validateQuestions(failures: ValidationFailure[]): void {
  if (!exists(QUESTIONS_DIR)) {
    console.log(`ℹ️  No data/questions/ directory yet — skipping question validation.`);
    return;
  }
  const files = listJsonFiles(QUESTIONS_DIR);
  if (files.length === 0) {
    console.log(`ℹ️  data/questions/ is empty — skipping question validation.`);
    return;
  }
  for (const filename of files) {
    const schema = QUESTION_SCHEMAS[filename];
    const filePath = join(QUESTIONS_DIR, filename);
    if (!schema) {
      failures.push({
        file: filePath,
        message: `Unknown question file. Expected one of: ${Object.keys(QUESTION_SCHEMAS).join(', ')}.`,
      });
      continue;
    }
    let data: unknown;
    try {
      data = readJson(filePath);
    } catch (err) {
      failures.push({
        file: filePath,
        message: `JSON parse error: ${(err as Error).message}`,
      });
      continue;
    }
    validate(schema, data, filePath, failures);
    console.log(`✓ ${filename} — validated against ${schema.constructor.name}`);
  }
}

function validateMessages(failures: ValidationFailure[]): void {
  if (!exists(MESSAGES_DIR)) {
    console.log(`ℹ️  No data/messages/ directory yet — skipping message validation.`);
    return;
  }
  const files = listJsonFiles(MESSAGES_DIR);
  if (files.length === 0) {
    console.log(`ℹ️  data/messages/ is empty — skipping message validation.`);
    return;
  }
  for (const filename of files) {
    const poolId = filename.replace(/\.json$/, '');
    const filePath = join(MESSAGES_DIR, filename);
    const poolIdResult = MessagePoolIdSchema.safeParse(poolId);
    if (!poolIdResult.success) {
      failures.push({
        file: filePath,
        message: `Unknown message pool name '${poolId}'. Expected one of: ${MessagePoolIdSchema.options.join(', ')}.`,
      });
      continue;
    }
    let data: unknown;
    try {
      data = readJson(filePath);
    } catch (err) {
      failures.push({
        file: filePath,
        message: `JSON parse error: ${(err as Error).message}`,
      });
      continue;
    }
    validate(MessagePoolSchema, data, filePath, failures);
    console.log(`✓ ${filename} — validated as MessagePool`);
  }
}

function main(): void {
  console.log('🔎 Validating Skilldares content…');
  const failures: ValidationFailure[] = [];
  validateQuestions(failures);
  validateMessages(failures);
  if (failures.length === 0) {
    console.log('✅ Content validation passed.');
    process.exit(0);
  }
  console.error(`\n❌ Content validation FAILED (${failures.length} issue(s)):\n`);
  for (const f of failures) {
    console.error(`  ${f.file}:\n    ${f.message}\n`);
  }
  process.exit(1);
}

main();
```

### Exact `package.json` Changes

**Current (post-Story 1.2):**

```json
{
  "name": "skilldares",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.2.6",
    "react-dom": "^19.2.6"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    ...
  }
}
```

**After Story 1.3:**

- Add `"zod": "^4.4.3"` to `dependencies` (npm install will populate the exact version)
- Add `"tsx": "^4.22.3"` to `devDependencies`
- Add `"prebuild": "tsx scripts/validate-content.ts"` to `scripts`

The two `npm install` commands in Task 2 handle the deps + lockfile updates. Add the `prebuild` script by editing `package.json` directly (Task 6).

### How `npm run prebuild` Works

npm has built-in support for `pre*` and `post*` script lifecycle hooks. When `npm run build` is invoked, npm automatically runs `prebuild` first if it exists. We rely on this — no need to manually wire the script into the build command. The `"build"` line itself stays exactly as it is (`"build": "tsc -b && vite build"`).

### Why tsx Instead of ts-node / node --import

- **tsx (4.22.3):** drop-in TypeScript runner using esbuild, no config, supports ESM out of the box, works with `"type": "module"` in package.json (which ours is). Single dev-dep.
- **ts-node:** older, requires more config with ESM, has caused friction with project-reference tsconfigs like ours.
- **node --import tsx:** functional but uses tsx under the hood anyway; explicit tsx CLI is clearer for a script invocation.

### Why Schemas Don't Include a `type` Discriminator

The three question schemas (MC, Speed Order, Speed Select) are stored in separate JSON files (one per question type). The validation script applies the correct schema based on filename. Adding a `type` field per question to JSON would be redundant (every entry in `multiple-choice.json` is implicitly MC). When the runtime needs to distinguish them in a unified pool (e.g., the reducer in Story 1.8), the type tag can be added at load time:

```typescript
// example pattern for Story 1.8 to use
const mcQuestions = MultipleChoicePoolSchema.parse(raw).map((q) => ({ ...q, type: 'mc' as const }));
```

This keeps authored JSON clean.

### Common LLM Mistakes to Avoid

- **Do NOT** install React Testing Library, Vitest, JSDOM, or `@testing-library/*` in this story — those land in Story 1.6 (test framework setup)
- **Do NOT** install dnd-kit, Motion, or any other library beyond `zod` + `tsx`
- **Do NOT** create `data/questions/` or `data/messages/` directories — those are created naturally when Stories 1.4 / 1.5 / 2.1 / 2.2 / 3.1 populate them with content
- **Do NOT** write unit tests for the schemas in this story — schemas-tested-by-content is the implicit test path. Story 1.6 sets up Vitest; retro-add formal schema unit tests there if needed.
- **Do NOT** add `"type"` discriminator fields to the schemas (filename-based dispatch is the chosen pattern; see "Why Schemas Don't Include a `type` Discriminator" above)
- **Do NOT** hand-write TypeScript interfaces parallel to the schemas (NFR: types must come from `z.infer<>` exclusively)
- **Do NOT** modify `tsconfig.app.json`, `vite.config.ts`, `amplify.yml`, `.gitignore`, `eslint.config.js`, `tsconfig.json`, `tsconfig.node.json` — none need changes here
- **Do NOT** add `scripts/` to `tsconfig.app.json` includes — tsx handles its own type-checking for the validator script
- **Do NOT** modify or import from `src/App.tsx`, `src/App.css`, `src/main.tsx`, `src/styles/global.css` — none touched in this story

### Testing Standards for This Story

No automated test framework yet (Story 1.6 introduces Vitest + RTL + JSDOM). Verification for Story 1.3 is:

1. **Type-check:** `npx tsc --noEmit` passes after creating each schema file
2. **Script smoke test:** `npx tsx scripts/validate-content.ts` exits 0 with the empty-case message
3. **Script error path:** temporary garbage JSON triggers exit 1 with clear error
4. **Build pipeline:** `npm run build` succeeds (prebuild runs, then tsc, then vite)
5. **Production:** Amplify build succeeds; live site is byte-identical

Story 1.6 will retroactively add formal schema unit tests using Vitest. For now, the empty-case + garbage-case smoke tests in Task 7 are sufficient evidence the validator works.

### Previous Story Intelligence

**From Story 1.2 (just shipped):**
- Push pattern is direct-to-main (user-authorized): commit on feature branch, fast-forward `main`, push, delete branch. No PR workflow.
- TypeScript strict mode is on (`tsconfig.app.json`). New files MUST type-check under strict.
- Vite scaffold is at version 8.0.14, React 19, project name `skilldares`.
- `src/main.tsx` imports `./styles/global.css`. Don't change.
- Amplify auto-deploys on push to main; `amplify.yml` is at root and runs `npm ci → npm run build`. The new `prebuild` script will execute on Amplify too — this is the whole point.

**From Story 1.1:**
- Custom domain `https://www.skilldares.com/` is live.
- AWS Amplify Console connected to GitHub `main` branch.
- `.gitignore` already covers `node_modules/`, `dist/`, etc. No changes needed.

### Git Intelligence

Last 4 commits on main:

```
3aabfcd Add Story 1.2 dev spec to planning artifacts
2fb8687 Story 1.2: add design tokens + Google Fonts
0e55a78 Add planning artifacts: epics breakdown + Story 1.1 dev spec
9e02940 Story 1.1: update README with live URL and dev info
```

Story 1.3 builds on `3aabfcd` (current main).

### Latest Tech Information

- **Zod 4.4.3** (verified 2026-05-22) — schema definition + runtime validation + TS type inference via `z.infer<>`. Tested against TypeScript v5.5+; ours is 6.0.2 — fine.
- **tsx 4.22.3** (verified 2026-05-23) — esbuild-powered TypeScript runner for Node.js. Works with ESM (our `"type": "module"`). Zero config.

### Project Structure Notes

**Alignment with `_bmad-output/planning-artifacts/architecture.md` §"Project Structure & Boundaries":**

- `src/lib/schemas/` is the architecture-specified location for Zod schemas ✓
- `scripts/validate-content.ts` matches the architecture's `scripts/` folder for build-time tooling ✓
- The schemas-as-single-source-of-truth pattern matches the architecture's "Content Loading Pattern" + "Implementation Patterns" anti-pattern list ("Hand-writing TypeScript types that mirror Zod schemas is an anti-pattern")
- The `prebuild` script matches the architecture's "Cross-Cutting → Content validation strategy: build-time = sanity gate before Amplify deploys"

**No structural deviations.**

### References

- **Story source:** `_bmad-output/planning-artifacts/epics.md` § "Epic 1, Story 1.3"
- **Architecture content pipeline:** `_bmad-output/planning-artifacts/architecture.md` § "Content Loading Pattern" + § "Build & Deploy Structure"
- **Architecture anti-patterns (relevant):** `_bmad-output/planning-artifacts/architecture.md` § "Implementation Patterns → Anti-Patterns to Avoid" (no hand-written types parallel to schemas)
- **PRD FRs covered:** FR53 (JSON files), FR54 (message JSON), FR55 (`menuRefs`), FR56 (runtime validation against types)
- **Zod docs:** https://zod.dev/
- **tsx docs:** https://tsx.is/
- **Story 1.2 dev spec:** `_bmad-output/implementation-artifacts/1-2-design-tokens-google-fonts.md`
- **Story 1.1 dev spec:** `_bmad-output/implementation-artifacts/1-1-project-scaffold-aws-amplify-deployment.md`

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (`claude-opus-4-7`) — running the bmad-dev-story workflow.

### Debug Log References

- `npm install zod@^4.4.3 --save` + `npm install tsx@^4.22.3 --save-dev` — both clean, 0 vulnerabilities
- `npx tsc --noEmit` passed cleanly after each schema file creation (TypeScript 6.0.2 + strict mode)
- Smoke test discovered cosmetic bug in validate-content.ts: script printed `✓ validated` for each file regardless of failure, then printed the FAILED summary afterward → confusing UX. Fixed by making `validate()` return boolean so the success line only prints when there were no failures for that file.
- Full build pipeline (prebuild → tsc → vite) executed cleanly, bundle sizes unchanged from pre-story (zod 4.4.3 not imported by runtime code yet — only by the build script)

### Completion Notes List

**Done (Tasks 1–9 local + push):**

- Branch `story/1-3-schemas-validation` created from main and merged back via fast-forward
- `zod@^4.4.3` added to dependencies; `tsx@^4.22.3` added to devDependencies
- Three pool schemas + three question schemas + types created in `src/lib/schemas/question.schema.ts`:
  - MultipleChoiceQuestion (with refine: funnyWrongIndex ≠ correctIndex)
  - SpeedOrderQuestion + SpeedOrderItem + SpeedOrderFactor enum
  - SpeedSelectQuestion (with refines: correctSet ⊆ items, no dupes in correctSet)
- MessagePoolIdSchema (8 pool names) + MessagePoolSchema in `src/lib/schemas/message.schema.ts`
- `scripts/validate-content.ts` with filename-based schema dispatch, empty-case handling, clear error reporting with field paths
- `package.json` `prebuild` script wired up; npm auto-runs before `build`
- Smoke test: empty case exits 0; garbage JSON triggers exit 1 with 5 detailed field errors
- Full build pipeline runs prebuild → tsc → vite cleanly; bundle unchanged
- Commit `99c46cb` pushed to main; Amplify deploy triggered

**Pending (Task 10):**

- User confirms Amplify build log shows the prebuild step ran successfully (empty-case message visible) and live site is unchanged

### File List

**New files:**
- `src/lib/schemas/question.schema.ts` — 3 question schemas + 3 pool schemas + factor enum + criteria-type enum + item sub-schema + 10 `z.infer<>` types
- `src/lib/schemas/message.schema.ts` — `MessagePoolIdSchema` (8 known pool names) + `MessagePoolSchema` (array of non-empty strings)
- `scripts/validate-content.ts` — build-time content validator with filename-based schema dispatch + empty-case handling

**Modified files:**
- `package.json` — added `zod: ^4.4.3` to dependencies, `tsx: ^4.22.3` to devDependencies, `"prebuild": "tsx scripts/validate-content.ts"` to scripts
- `package-lock.json` — npm install updates for zod + tsx + their transitive deps

**Untouched (intentionally):**
- All Story 1.1 + 1.2 files (scaffold, index.html, src/main.tsx, src/App.tsx, src/styles/global.css, amplify.yml, tsconfig.*, vite.config.ts, eslint.config.js, .gitignore, README.md)
- `data/menu_front.md`, `data/menu_back.md` (source menu, untouched)
- `data/questions/` and `data/messages/` (do NOT exist yet — Stories 1.4-1.5 / 2.1-2.2 / 3.1 create them)

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-23 | Story created from epics.md via bmad-create-story workflow | bmad-create-story (Claude Opus 4.7) |
| 2026-05-23 | Story implemented: Zod schemas (3 question types + message pools) + build-time validation script with empty-case + error-path tested. Commit `99c46cb` pushed to main, Amplify deploy verified. Status → review. | bmad-dev-story (Claude Opus 4.7) |
