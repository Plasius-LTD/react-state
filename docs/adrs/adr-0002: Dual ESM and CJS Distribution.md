# ADR-0002: Dual ESM and CJS Distribution

## Status

- Proposed -> Accepted
- Date: 2025-09-15
- Version: 1.0
- Supersedes: N/A
- Superseded by: N/A

## Context

The library must be consumable by both modern ESM bundlers and legacy CommonJS environments. Some consumers require `require()` support, while others rely on ESM tree-shaking. We also want to ship TypeScript types.

## Decision

We will publish dual ESM and CJS builds using `tsup`, with an exports map that provides:

- `import` -> `dist/index.js`
- `require` -> `dist/index.cjs`
- `types` -> `dist/index.d.ts`

## Consequences

- **Positive:** Broad compatibility across bundlers and Node runtimes; explicit typing support.
- **Negative:** Build complexity increases and ESM/CJS outputs must stay in sync.
- **Neutral:** Consumers select the format automatically via the exports map.

## Alternatives Considered

- **ESM-only:** Rejected due to CommonJS consumer requirements.
- **CJS-only:** Rejected because ESM is the primary modern path for bundlers.
- **Single bundle without exports map:** Rejected due to ambiguous resolution and weaker tooling integration.
