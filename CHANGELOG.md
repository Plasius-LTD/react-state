
# Changelog

All notable changes to this project will be documented in this file.

The format is based on **[Keep a Changelog](https://keepachangelog.com/en/1.1.0/)**, and this project adheres to **[Semantic Versioning](https://semver.org/spec/v2.0.0.html)**.

---

## [Unreleased]

- **Added**
  - (placeholder)

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)

## [1.2.6] - 2026-03-04

- **Added**
  - (placeholder)

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)

## [1.2.2] - 2026-02-28

- **Added**
  - (placeholder)

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)

## [1.2.1] - 2026-01-22

- **Added**
  - (placeholder)

- **Changed**
  - DEV mode detection prefers `import.meta.env` when available and falls back to `NODE_ENV`.

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)

## [1.2.0] - 2025-12-31

- **Added**
  - Regression tests for dispatch batching, selector comparator errors, and dispatch stability.

- **Changed**
  - `useStore` now uses `useSyncExternalStore` for tearing-safe React snapshots.
  - Scoped `useSelector` subscribes via selector equality to skip redundant renders and batches notifications.
  - React peer dependency broadened to `^18.2 || ^19` for wider compatibility.
  - `useDispatch` now returns a stable reference across renders to avoid dependency churn.

- **Fixed**
  - Scoped Provider re-initializes when `initialState` changes instead of sticking to the first render.
  - Selector listeners now honor custom equality to avoid spurious notifications, defaulting to `Object.is` when none is supplied.
  - Selector equality errors are surfaced while other selectors continue to notify.
  - A throwing listener no longer prevents other listeners from running (errors re-thrown after notification).
  - Scoped notifications coalesce multiple same-tick dispatches into a single render flush.

- **Security**
  - (placeholder)

## [1.1.1] - 2025-10-16

- **Added**
  - @plasius/nfr tracking added

- **Changed**
  - Add `main`, `module`, and `types` fields alongside the export map to improve CJS/ESM compatibility.
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)

## [1.1.0] - 2025-10-10

- **Added**
  - (placeholder)

- **Changed**
  - Improved batching of change notifications.
  - Tests now (need to) include notification flushes <code>await act(async ()=>{});</code>

- **Fixed**
  - Singleton removal for the store in Provider.
  - Improved CD pipeline no longer double commits on release.

- **Security**
  - (placeholder)

## [1.0.13] - 2025-10-01

- **Added**
  - In DEV freeze all previous states before calling the reducer

- **Changed**
  - Moved react to a peerDependency rather than a dependency

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)

## [1.0.12] - 2025-09-24

- **Added**
  - (placeholder)

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)

## [1.0.11] - 2025-09-24

- **Added**
  - (placeholder)

- **Changed**
  - package.json update to include:
    - "sideEffects": false,
    - "files": ["dist"],
  - package.json removed:
    - "main": "./dist/index.cjs",
    - "module": "./dist/index.js",
    - "types": "./dist/index.d.ts",

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)

## [1.0.10] - 2025-09-17

- **Fixed**
  - CD Pipeline ordering fix for version in CHANGELOG.md

## [1.0.7] - 2025-09-17

- **Added**
  - Code coverage added.

---

## [1.0.0] - 2025-09-16

- **Added**

  - Initial public release of `@plasius/react-state`.
  - `createStore` for basic state container functionality with `dispatch`, `getState`, and subscription API.
  - `createScopedStoreContext` for React integration:
    - `<Provider>` component wrapping React trees,
    - `useStore()` to access state,
    - `useDispatch()` to dispatch actions.
  - Support for per-key subscriptions and selector-based subscriptions.
  - Unit tests with Vitest and component tests with React Testing Library.

- **Changed**
  - N/A (initial release)

- **Fixed**
  - N/A (initial release)

---

## Release process (maintainers)

1. Update `CHANGELOG.md` under **Unreleased** with user‑visible changes.
2. Bump version in `package.json` following SemVer (major/minor/patch).
3. Move entries from **Unreleased** to a new version section with the current date.
4. Tag the release in Git (`vX.Y.Z`) and push tags.
5. Publish to npm (via CI/CD or `npm publish`).

> Tip: Use Conventional Commits in PR titles/bodies to make changelog updates easier.

---

[Unreleased]: https://github.com/Plasius-LTD/react-state/compare/v1.2.6...HEAD
[1.0.0]: https://github.com/Plasius-LTD/react-state/releases/tag/v1.0.0
[1.0.7]: https://github.com/Plasius-LTD/react-state/releases/tag/v1.0.7
[1.0.10]: https://github.com/Plasius-LTD/react-state/releases/tag/v1.0.10
[1.0.11]: https://github.com/Plasius-LTD/react-state/releases/tag/v1.0.11
[1.0.12]: https://github.com/Plasius-LTD/react-state/releases/tag/v1.0.12
[1.0.13]: https://github.com/Plasius-LTD/react-state/releases/tag/v1.0.13
[1.1.0]: https://github.com/Plasius-LTD/react-state/releases/tag/v1.1.0
[1.1.1]: https://github.com/Plasius-LTD/react-state/releases/tag/v1.1.1
[1.2.0]: https://github.com/Plasius-LTD/react-state/releases/tag/v1.2.0
[1.2.1]: https://github.com/Plasius-LTD/react-state/releases/tag/v1.2.1

## [1.2.1] - 2026-02-11

- **Added**
  - Initial release.

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)
[1.2.2]: https://github.com/Plasius-LTD/react-state/releases/tag/v1.2.2
[1.2.6]: https://github.com/Plasius-LTD/react-state/releases/tag/v1.2.6
