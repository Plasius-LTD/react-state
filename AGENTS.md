# AGENTS.md

## Scope
- This repo is `@plasius/react-state`, a tiny React state library written in TypeScript/ESM.
- Source lives in `src/`, tests in `tests/`, and build output in `dist/`.

## Setup
- Use Node 22 (see `.nvmrc`) and npm.
- Install dependencies with `npm ci`.

## Common commands
- `npm run build` (tsup)
- `npm test` (vitest run)
- `npm run test:watch`
- `npm run lint`
- `npm run clean`

## Conventions
- Keep public APIs stable and typed; prefer small, focused changes.
- Avoid editing `dist/` unless explicitly requested (generated output).
- Update docs or `CHANGELOG.md` when user-facing behavior changes.
- Follow `CONTRIBUTING.md` for commit and contribution norms.

## Notes for agents
- Prefer editing `src/` and `tests/`.
- Avoid adding new dependencies unless necessary and justified.

## AI guidance
- After any change, run relevant BDD/TDD tests when they exist; mention if skipped.
- For fixes, add/update a BDD or TDD test that fails first and validate it passes after the fix when possible.
- When adding or updating dependencies, prefer lazy-loading (dynamic import/code splitting) to avoid heavy first-load network use when applicable.
