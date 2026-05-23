# skilldares

A Kildares learning application — a static web quiz game that helps new servers at Kildares pub memorize the menu.

## Live URL

**Production:** [https://www.skilldares.com/](https://www.skilldares.com/)

Deployed automatically from `main` via AWS Amplify. Build pipeline defined in `amplify.yml`.

## Development

```bash
npm install     # install dependencies
npm run dev     # start Vite dev server on http://localhost:5173
npm run build   # produce production bundle in dist/
npm run preview # serve the production build locally
npm run lint    # run ESLint
```

## Tech Stack

- **TypeScript** (strict mode)
- **React 19**
- **Vite** — dev server + production build
- **AWS Amplify** — hosting + CI/CD

## Planning Artifacts

The project's planning bundle (brief, PRD, architecture, UX spec, epics) lives in `_bmad-output/planning-artifacts/`.
