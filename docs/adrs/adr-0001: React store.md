# ADR-0001: React State Store Purpose and Scope

## Status

- Proposed → Accepted
- Date: 2025-09-12
- Version: 1.0
- Supersedes: N/A
- Superseded by: N/A

## Context

Managing React application state across multiple components is a common challenge. Existing solutions (Redux, Zustand, Jotai, etc.) offer different trade-offs in complexity, ergonomics, and bundle size. For the Plasius ecosystem, we want:

- A minimal, type-safe state container,
- Strong integration with React via Context and Hooks,
- Support for both global and scoped stores,
- Predictable subscription and unsubscribe behaviour,
- Alignment with SOLID principles and enterprise-grade maintainability.

## Decision

We will build a dedicated library, `@plasius/react-state`, that:

- Provides a `createStore` primitive for basic state containers,
- Provides `createScopedStoreContext` to integrate with React Context/Provider patterns,
- Exposes hooks (`useStore`, `useDispatch`) to read state and dispatch actions,
- Supports subscriptions: global, per-key, and selector-based,
- Ensures distinct-until-changed semantics to avoid unnecessary re-renders,
- Is published as an open source package under the Plasius-LTD organisation.

## Consequences

- **Positive:** Consistent and predictable state handling across Plasius projects, type-safe APIs, lighter alternative to Redux, improved testability, open source adoption possible.
- **Negative:** Adds maintenance burden to keep feature parity with evolving React ecosystem; community may default to established libraries.
- **Neutral:** Internal consumers may still choose other state management libs if required, but Plasius packages will standardise on this one.

## Alternatives Considered

- **Use Redux or Redux Toolkit:** Very mature, but verbose and heavier than desired.
- **Use Zustand or Jotai:** Good ergonomics, but external dependency risk and less control over PII handling and subscription semantics.
- **React Context alone:** Too minimal, lacking structured dispatch and subscribe/unsubscribe APIs.
