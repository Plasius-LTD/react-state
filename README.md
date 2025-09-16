# @plasius/react-state

[![npm version](https://img.shields.io/npm/v/@plasius/react-state.svg)](https://www.npmjs.com/package/@plasius/react-state)
[![Build Status](https://img.shields.io/github/actions/workflow/status/Plasius-LTD/react-state/ci.yml?branch=main&label=build&style=flat)](https://github.com/plasius/react-state/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/Plasius-LTD/react-state)](./LICENSE)
[![Code of Conduct](https://img.shields.io/badge/code%20of%20conduct-yes-blue.svg)](./CODE_OF_CONDUCT.md)
[![Security Policy](https://img.shields.io/badge/security%20policy-yes-orange.svg)](./SECURITY.md)
[![Changelog](https://img.shields.io/badge/changelog-md-blue.svg)](./CHANGELOG.md)

## Overview

`@plasius/react-state` provides a scoped state management solution for React applications. It allows developers to create isolated, testable, and composable stores without introducing heavy dependencies.

## Installation

```bash
npm install @plasius/react-state
```

## Usage Example

```tsx
type Action =
  | { type: "INCREMENT_VALUE"; payload: number }
  | { type: "SET_VALUE"; payload: number }
  | { type: "DECREMENT_VALUE"; payload: number };

interface State {
  value: number;
}

const initialState: State = { value: 0 };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "INCREMENT_VALUE":
      return { ...state, value: state.value + action.payload };
    case "DECREMENT_VALUE":
      return { ...state, value: state.value - action.payload };
    case "SET_VALUE":
      // Distinct-until-changed: return the SAME reference if no change,
      // so listeners relying on referential equality will not fire.
      if (action.payload === state.value) return state;
      return { ...state, value: action.payload };
    default:
      return state;
  }
}

const store = createStore<State, Action>(reducer, initialState);

function doSomething() {
  store.dispatch({ type: "INCREMENT_VALUE", payload: 1});
}
```

## Contributing

Contributions are welcome! Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) and [Contributing Guide](./CONTRIBUTING.md) before submitting PRs.

## License

This project is licensed under the terms of the [Apache 2.0 license](./LICENSE).
