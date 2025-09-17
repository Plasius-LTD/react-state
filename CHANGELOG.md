
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

[Unreleased]: https://github.com/Plasius-LTD/react-state/compare/v...HEAD
[1.0.0]: https://github.com/Plasius-LTD/react-state/releases/tag/v1.0.0
