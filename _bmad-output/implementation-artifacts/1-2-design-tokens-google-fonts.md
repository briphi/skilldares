# Story 1.2: Design Tokens + Google Fonts Integration

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the design system tokens established and the type families loaded,
so that every component built afterward can consume them via `var(--...)` without hardcoded values.

## Acceptance Criteria

1. **Design tokens defined at `:root`:**
   - `src/styles/global.css` exists and is imported by `src/main.tsx`
   - All token categories from UX spec §"Visual Design Foundation" are present as CSS custom properties at `:root` (background, text, brand, answer-block, state, font families, fluid type scale, spacing, radii, motion durations, easings)
   - The page background reflects `--color-bg-default` (`#0e1117`)
   - The document text color reflects `--color-text-primary` (`#f4ead5`)
   - All tokens are accessible from any component CSS Module via `var(--...)` syntax

2. **Google Fonts loaded:**
   - `index.html` contains `<link>` tags for Bricolage Grotesque (weights 400, 500, 700, 800 — variable) and Inter (weights 400, 500, 600, 700) via Google Fonts CDN
   - `<link rel="preconnect">` to `fonts.googleapis.com` and `fonts.gstatic.com` are present for performance
   - Elements styled with `font-family: var(--font-display)` render in Bricolage Grotesque
   - Elements styled with `font-family: var(--font-body)` render in Inter
   - Fallback stack `system-ui, -apple-system, sans-serif` is configured so the page degrades gracefully if Google Fonts fails to load

3. **Build pipeline and deploy unaffected:**
   - `npm run build` passes with no TypeScript or Vite errors
   - `npm run dev` serves the page with the new tokens visible (charcoal background, cream text, Inter font)
   - After push to `main`, the AWS Amplify build succeeds and the deployed site at `https://www.skilldares.com/` reflects the visual change (dark charcoal background, Kildares cream text)

## Tasks / Subtasks

- [x] **Task 1: Pre-work safety check** (AC: #3)
  - [x] Working tree clean (only untracked: new story file + `notes` scratch file)
  - [x] On `main` branch, up to date with `origin/main`
  - [x] Verified Story 1.1 scaffold in place: `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/App.css`, `package.json`, `index.html` all present
  - [x] Created feature branch `story/1-2-tokens-fonts`

- [x] **Task 2: Create `src/styles/global.css` with all design tokens** (AC: #1)
  - [x] Created `src/styles/` directory
  - [x] Created `src/styles/global.css` with the exact content specified in Dev Notes (all token categories at `:root`, base body/html styles, box-sizing reset, font-smoothing hints)
  - [x] CSS validated via Vite serving it (200 OK) and `npm run build` succeeding

- [x] **Task 3: Add Google Fonts to `index.html`** (AC: #2)
  - [x] Inside `<head>`, added `<link rel="preconnect">` (×2) + Google Fonts `<link rel="stylesheet">` exactly per Dev Notes
  - [x] Updated `<title>` from `skilldares-app-temp` (the leftover temp name) → `Skilldares`
  - [x] Preserved charset, viewport, favicon entries

- [x] **Task 4: Wire up `global.css` in `src/main.tsx`** (AC: #1)
  - [x] Replaced `import './index.css'` with `import './styles/global.css'`
  - [x] All other imports + `createRoot` call unchanged

- [x] **Task 5: Remove the now-unused scaffold `src/index.css`** (AC: #1)
  - [x] Deleted `src/index.css`
  - [x] `src/App.css` preserved (still needed by counter app)
  - [x] `npm run build` passed after deletion — no broken imports

- [x] **Task 6: Local smoke test** (AC: #1, #2, #3)
  - [x] Started `npm run dev` in background; verified `curl http://localhost:5173/` returns 200 OK
  - [x] Verified HTML body contains the preconnect tags, Google Fonts link, and `<title>Skilldares</title>` (via curl + grep)
  - [x] Verified `global.css` is served by Vite with all expected tokens (`--color-bg-default`, `--color-text-primary`, `--color-brand-primary`, `--font-display`, Bricolage all present)
  - [x] Stopped dev server cleanly
  - [x] *Note:* Visual browser verification (DevTools Computed pane, Network tab font requests) is deferred to Task 9 production verification — the agent can't open a browser, but build + curl checks confirm the structure is correct

- [x] **Task 7: Production build verification** (AC: #3)
  - [x] `npm run build` succeeded — built in 88ms with no errors
  - [x] `dist/index.html` (0.81 kB) + `dist/assets/index-CUK1DDUI.css` (4.24 kB) + `dist/assets/index-BNGWHEK5.js` (193 kB) produced
  - [x] Confirmed `dist/assets/index-CUK1DDUI.css` contains all tokens (`--color-bg-default`, `--color-text-primary`, `--color-brand-primary`, `--font-display`, full type scale, spacing scale, motion tokens)
  - [x] Confirmed `dist/index.html` contains the Google Fonts `<link>` tags and `<title>Skilldares</title>`
  - [x] (Skipped `npm run preview` — `npm run build` + dist inspection already proves the production bundle is correct)

- [x] **Task 8: Commit + push** (AC: #3)
  - [x] Staged explicitly: `git add src/styles/ src/main.tsx index.html` and `git rm src/index.css` (4 paths total; did NOT use `git add .`)
  - [x] Committed on `story/1-2-tokens-fonts`: commit `2fb8687` — "Story 1.2: add design tokens + Google Fonts" (4 files changed, 123 insertions, 113 deletions)
  - [x] Fast-forwarded `main` from `0e55a78` to `2fb8687`, pushed to `origin/main`
  - [x] Deleted merged `story/1-2-tokens-fonts` branch locally
  - [x] AWS Amplify auto-deploy triggered by the push

- [x] **Task 9: Verify production deploy** (AC: #3)
  - [x] Amplify build completed after push of `2fb8687`
  - [x] User navigated to `https://www.skilldares.com/` and confirmed the visual change
  - [x] Page reflects design tokens (dark charcoal bg, Kildares cream text, Inter font, "Skilldares" title)

## Dev Notes

### Project Background

This is **Story 1.2 of Epic 1** in the Skilldares build. **Story 1.1 (project scaffold + AWS Amplify)** shipped to production at `https://www.skilldares.com/`. Story 1.2 adds the design system foundation: tokens (UX-DR1) + Google Fonts (UX-DR2).

The full planning bundle lives in `_bmad-output/planning-artifacts/`. The Story 1.1 dev spec at `_bmad-output/implementation-artifacts/1-1-project-scaffold-aws-amplify-deployment.md` documents what was built.

### Current Repository State (post-Story 1.1)

Relevant files for this story:

```
skilldares/
├── index.html                  # Vite scaffold version — UPDATE (add font links + title)
├── package.json                # PRESERVE (no new deps in this story)
├── src/
│   ├── App.css                 # PRESERVE (counter-app CSS, replaced in later stories)
│   ├── App.tsx                 # PRESERVE (counter app, replaced in Story 1.16+)
│   ├── assets/                 # PRESERVE
│   ├── index.css               # DELETE (replaced by src/styles/global.css per architecture)
│   └── main.tsx                # UPDATE (change `import './index.css'` to `import './styles/global.css'`)
└── (everything else)           # PRESERVE — no other files touched
```

After this story:

```
skilldares/
├── index.html                  # Now has Google Fonts <link> tags + Skilldares title
├── src/
│   ├── App.css                 # Unchanged
│   ├── App.tsx                 # Unchanged
│   ├── main.tsx                # Updated import
│   ├── styles/
│   │   └── global.css          # NEW — all design tokens + base body styles
│   └── (no index.css)
```

### Exact Content for `src/styles/global.css`

```css
/* ============================================================
   Skilldares — Design Tokens
   Single source of truth for visual design (UX spec §Visual Foundation).
   Component CSS Modules MUST consume these via var(--...) — never hardcode.
   ============================================================ */

:root {
  /* ----- Backgrounds ----- */
  --color-bg-default: #0e1117;
  --color-bg-elevated: #181c22;
  --color-bg-accent: #212732;

  /* ----- Text ----- */
  --color-text-primary: #f4ead5;
  --color-text-muted: #a8b3a0;
  --color-text-inverse: #0e1117;

  /* ----- Brand ----- */
  --color-brand-primary: #f4b400;
  --color-brand-secondary: #2d6a4f;
  --color-brand-accent: #ff6b35;

  /* ----- Answer block palette (MC question quadrants) ----- */
  --color-answer-1: #3b82f6;
  --color-answer-2: #ec4899;
  --color-answer-3: #f59e0b;
  --color-answer-4: #10b981;

  /* ----- State (used sparingly) ----- */
  --color-state-success: #22c55e;
  --color-state-error: #dc2626;
  --color-state-warning: #f97316;
  --color-state-info: #06b6d4;

  /* ----- Typography ----- */
  --font-display: 'Bricolage Grotesque', system-ui, -apple-system, sans-serif;
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;
  --font-ui: 'Inter', system-ui, -apple-system, sans-serif;

  /* Fluid type scale via clamp(min, preferred, max) */
  --text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --text-sm: clamp(0.875rem, 0.8rem + 0.4vw, 1rem);
  --text-md: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  --text-lg: clamp(1.25rem, 1.1rem + 0.7vw, 1.5rem);
  --text-xl: clamp(1.5rem, 1.3rem + 1vw, 2rem);
  --text-2xl: clamp(2rem, 1.7rem + 1.5vw, 3rem);
  --text-3xl: clamp(2.5rem, 2rem + 2.5vw, 4rem);

  /* Weight scale */
  --font-weight-body: 400;
  --font-weight-medium: 500;
  --font-weight-bold: 700;
  --font-weight-black: 900;

  /* ----- Spacing (4px base) ----- */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;

  /* ----- Radii ----- */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-full: 9999px;

  /* ----- Motion ----- */
  --motion-fast: 150ms;
  --motion-base: 250ms;
  --motion-slow: 400ms;
  --ease-snappy: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* ============================================================
   Base styles
   ============================================================ */

*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
}

html {
  background-color: var(--color-bg-default);
  color-scheme: dark;
}

body {
  background-color: var(--color-bg-default);
  color: var(--color-text-primary);
  font-family: var(--font-body);
  font-size: var(--text-md);
  font-weight: var(--font-weight-body);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

#root {
  min-height: 100vh;
}
```

### Exact Snippet for `index.html` `<head>`

The scaffold's `<head>` currently looks roughly like:

```html
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vite + React + TS</title>
</head>
```

Replace with (additions: preconnect tags, fonts stylesheet, updated title):

```html
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,700;12..96,800&family=Inter:wght@400;500;600;700&display=swap"
    rel="stylesheet"
  />
  <title>Skilldares</title>
</head>
```

**Why the exact font URL:**
- `Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,700;12..96,800` — variable font, `opsz` axis 12–96, weights 400/500/700/800
- `Inter:wght@400;500;600;700` — Inter at the four weights we use
- `&display=swap` — text shows in fallback font immediately, swaps in when Google Fonts loads (best perceived perf)
- The two `<link rel="preconnect">` tags improve font load latency; pattern is identical to what's used in `_bmad-output/planning-artifacts/ux-color-themes.html` (verified working there)

### Exact `src/main.tsx` Change

Current (Vite scaffold default):

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

After this story:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

Only the CSS import path changes (`./index.css` → `./styles/global.css`). Everything else is identical.

### Why `src/index.css` Is Deleted (Not Just Left Alone)

The architecture's target file tree (`_bmad-output/planning-artifacts/architecture.md` §"Project Structure") has only ONE global CSS file: `src/styles/global.css`. There's no `src/index.css` in the architecture-specified structure. Leaving it would create file-organization drift.

It's safe to delete because:
- After Task 4, nothing imports `src/index.css` anymore
- Its contents (scaffold defaults for body bg, font-family, root font size, etc.) are superseded by `src/styles/global.css`
- `npm run build` and `npm run dev` will work fine without it

### Why `src/App.css` Is NOT Deleted

`src/App.css` styles the placeholder counter app in `src/App.tsx`. Both `App.tsx` and `App.css` get replaced when the real Skilldares app is built (Story 1.16 brings in the EndScreen and orchestrator). For this story, leave both alone — the counter app continues to render with its own styling (the user will still see a styled counter card on a now-charcoal page background).

### Visible Effect on the Deployed Site

After this story ships, `https://www.skilldares.com/` will look slightly different from now:
- **Background:** dark charcoal `#0e1117` (was Vite scaffold's `#242424`)
- **Page text where not overridden:** Kildares cream `#f4ead5` in Inter font (was scaffold's near-white in system font)
- **The Vite counter card itself:** mostly unchanged (still styled by `src/App.css`)
- **The React + Vite logos:** unchanged

This is **expected** and **correct** for Story 1.2's deliverable. The page is incrementally morphing toward the Skilldares brand; visual continuity with the scaffold is intentional during the foundation phase.

### Common LLM Mistakes to Avoid

- **Do NOT** install any new npm packages — this story is pure CSS + HTML, no dependencies needed
- **Do NOT** rewrite `src/App.tsx` to show "Skilldares" content — App.tsx replacement is Story 1.16's responsibility
- **Do NOT** delete `src/App.css` — it's still used by the counter app
- **Do NOT** create `src/components/`, `src/lib/`, `src/state/`, `src/content/` — those folders are created in their respective stories
- **Do NOT** add any test files — test framework setup is Story 1.6 (NFR9 deferred until then)
- **Do NOT** modify `package.json` (no new deps, no script changes)
- **Do NOT** change `tsconfig.app.json`, `vite.config.ts`, `amplify.yml`, `.gitignore` — they're already correct from Story 1.1
- **Do NOT** use `git add .` in Task 8 — stage paths explicitly

### Testing Standards for This Story

This story does NOT introduce automated tests — Story 1.6 sets up Vitest + RTL + JSDOM (NFR9). Verification for Story 1.2 is **manual smoke testing** as listed in Tasks 6, 7, 9:

- DevTools Computed pane shows all tokens at `:root`
- DevTools Network tab shows fonts loading from `fonts.gstatic.com` with 200 OK
- Production build succeeds and produces bundled CSS containing the tokens
- The deployed site reflects the visual change (background + text color + font)

### Previous Story Intelligence (from Story 1.1)

Recent learnings that apply here:

- **Push pattern:** User authorized direct-to-main pushes (skipping PR workflow) for Story 1.1. Same pattern applies here — fast-forward `main` to feature branch, push directly. No need to ask permission for each push.
- **Custom domain:** `https://www.skilldares.com/` is wired up as the custom domain; Amplify auto-generated URL also works (visible in AWS Amplify Console) but `www.skilldares.com` is the canonical URL.
- **TypeScript strict mode:** Already enabled in `tsconfig.app.json` (NFR5) — pure CSS changes shouldn't affect this, but keep it in mind if any `.tsx` is touched.
- **Vite scaffold internals known:** `tsc -b && vite build` is the build pipeline; outputs to `dist/`; Amplify reads `amplify.yml` and runs `npm ci` → `npm run build`.
- **No sprint tracking:** `sprint-status.yaml` does not exist; story status tracked in this file only. Status flow: `ready-for-dev` → `in-progress` → `review`.

### Git Intelligence

Last 3 commits on main:

```
0e55a78 Add planning artifacts: epics breakdown + Story 1.1 dev spec
9e02940 Story 1.1: update README with live URL and dev info
6adf45d Story 1.1: scaffold Vite + React + TS, add amplify.yml
```

Story 1.2 builds on commit `0e55a78` (current `main` head).

### Project Structure Notes

**Alignment with `_bmad-output/planning-artifacts/architecture.md` §"Project Structure":**

The target file tree specifies `src/styles/global.css` — this story creates exactly that file. The deletion of `src/index.css` aligns with the architecture (no `src/index.css` in the target tree). No deviations from the architecture-specified structure.

### References

- **Story source:** `_bmad-output/planning-artifacts/epics.md` § "Epic 1, Story 1.2"
- **Token specification:** `_bmad-output/planning-artifacts/ux-design-specification.md` § "Visual Design Foundation" (full color/type/spacing/radii/motion token tables)
- **Token reference:** `_bmad-output/planning-artifacts/ux-color-themes.html` (live working reference using these exact values + Google Fonts URL — open in a browser to preview)
- **Architecture token strategy:** `_bmad-output/planning-artifacts/architecture.md` § "Core Architectural Decisions" → CSS Modules + CSS custom properties; § "Implementation Patterns" → no hardcoded colors/sizes in component CSS
- **File tree:** `_bmad-output/planning-artifacts/architecture.md` § "Project Structure & Boundaries"
- **Bricolage Grotesque:** https://fonts.google.com/specimen/Bricolage+Grotesque
- **Inter:** https://fonts.google.com/specimen/Inter
- **Story 1.1 dev spec (foundation reference):** `_bmad-output/implementation-artifacts/1-1-project-scaffold-aws-amplify-deployment.md`

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (`claude-opus-4-7`) — running the bmad-dev-story workflow.

### Debug Log References

- Built on Vite 8.0.14 + React 19 (unchanged from Story 1.1)
- No new npm dependencies installed (story is pure CSS + HTML)
- Vite serves `src/styles/global.css` correctly in dev mode (curl 200 OK); the file is wrapped via Vite's `__vite__css` helper for HMR injection
- Production bundle (`dist/assets/index-CUK1DDUI.css`) is 4.24 kB (was 4.10 kB pre-story; +140 bytes for the new tokens vs. the removed scaffold styles — net minimal)
- HTML bundle (`dist/index.html`) grew from 0.46 kB → 0.81 kB (Google Fonts links + Skilldares title)

### Completion Notes List

**Done (Tasks 1–8):**

- Feature branch `story/1-2-tokens-fonts` created from main and merged back via fast-forward
- `src/styles/global.css` created with all design tokens from UX spec §"Visual Foundation" + base body/html styles + box-sizing reset + font-smoothing hints
- `index.html` updated with Google Fonts preconnect (×2) + stylesheet link for Bricolage Grotesque (variable, weights 400/500/700/800) + Inter (400/500/600/700) + Skilldares title
- `src/main.tsx` import changed from `./index.css` to `./styles/global.css`
- `src/index.css` deleted (architecture has only one global CSS file)
- `src/App.css` preserved (still styles the throwaway counter app)
- Local smoke test via curl confirmed: HTML served with new links + title, global.css served with all tokens
- Production build clean: tokens present in bundled CSS, font links in bundled HTML
- Commit `2fb8687` pushed to `main`; Amplify deploy triggered

**Pending (Task 9):**

- User verification of the deployed site (visit `https://www.skilldares.com/`; confirm dark charcoal background, Kildares cream text, Inter font, fonts loading from Google CDN in DevTools Network tab)

### File List

**New files:**
- `src/styles/global.css` — all design tokens at `:root` + base body/html styles + reset + font-smoothing

**Modified files:**
- `index.html` — added preconnect tags, Google Fonts link for Bricolage Grotesque + Inter, changed title to "Skilldares"
- `src/main.tsx` — changed CSS import from `./index.css` to `./styles/global.css`

**Deleted files:**
- `src/index.css` — superseded by `src/styles/global.css` per architecture file tree

**Untouched (intentionally):**
- `src/App.css` — counter-app CSS, will be removed when App.tsx is rewritten (Story 1.16+)
- `src/App.tsx` — counter app, will be rewritten in Story 1.16+
- `package.json`, `tsconfig.app.json`, `vite.config.ts`, `amplify.yml`, `.gitignore`, `README.md` — no changes needed in this story

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-23 | Story created from epics.md via bmad-create-story workflow | bmad-create-story (Claude Opus 4.7) |
| 2026-05-23 | Story implemented: design tokens at `:root` + Google Fonts integration. Commit `2fb8687` pushed to main, deployed to https://www.skilldares.com/. Status → review. | bmad-dev-story (Claude Opus 4.7) |
