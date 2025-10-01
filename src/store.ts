import type { Reducer, Listener } from "./types.js";
import { deepFreeze } from "./freeze.js";

const DEV =
  typeof import.meta !== "undefined"
    ? (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV
    : process.env.NODE_ENV !== "production";

// Allow narrower parameter types for callbacks without fighting variance
type BivariantListener<T> = {
  bivarianceHack(value: T): void;
}["bivarianceHack"];

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IState {}
export interface IAction {
  type: string;
}

export interface Store<S extends IState, A extends IAction> {
  getState(): S;
  dispatch(action: A): void;
  /**
   * Subscribe to all state changes.
   */
  subscribe(listener: Listener): () => void;
  /**
   * Subscribe to changes of a specific key in the state.
   */
  subscribeToKey<K extends keyof S>(
    key: K,
    listener: (value: S[K]) => void
  ): () => void;
  /**
   * Subscribe to changes in a selected value from the state.
   */
  subscribeWithSelector<T>(
    selector: (state: S) => T,
    listener: (selected: T) => void
  ): () => void;
}

export function createStore<S extends IState, A extends IAction>(
  reducer: Reducer<S, A>,
  initialState: S
): Store<S, A> {
  let state: S = DEV ? deepFreeze(initialState) : initialState;
  const listeners = new Set<Listener>();
  const keyListeners = new Map<keyof S, Set<BivariantListener<S[keyof S]>>>();

  interface SelectorEntry<T> {
    selector: (state: S) => T;
    listener: BivariantListener<T>;
    lastValue: T;
  }
  const selectorListeners = new Set<SelectorEntry<unknown>>();

  const getState = () => state;

  const dispatch = (action: A) => {
    const prevState = state;
    const nextState = reducer(state, action);
    
    if (DEV) deepFreeze(nextState);
    
    // Distinct-until-changed: if the reducer returns the same reference,
    // skip all notifications (prevents unnecessary re-renders).
    if (Object.is(prevState, nextState)) {
      state = nextState; // keep any identity guarantees from reducer
      return;
    }

    state = nextState;

    // Notify global listeners (iterate over a snapshot so unsubscribe during
    // notify does not skip the next listener)
    for (const listener of [...listeners]) listener();

    // Notify key listeners only when that key actually changed (Object.is)
    for (const [key, set] of keyListeners.entries()) {
      if (!Object.is(prevState[key], state[key])) {
        for (const listener of [...set]) listener(state[key]);
      }
    }

    // Notify selector listeners only when selected value changed (Object.is)
    selectorListeners.forEach((entry) => {
      const nextValue = (entry.selector as (s: S) => unknown)(state);
      if (!Object.is(entry.lastValue, nextValue)) {
        entry.lastValue = nextValue as unknown;
        (entry.listener as (v: unknown) => void)(nextValue);
      }
    });
  };

  const subscribe = (listener: Listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const subscribeToKey = <K extends keyof S>(
    key: K,
    listener: (value: S[K]) => void
  ) => {
    const set =
      keyListeners.get(key) ?? new Set<BivariantListener<S[keyof S]>>();
    set.add(listener as unknown as BivariantListener<S[keyof S]>);
    keyListeners.set(key, set);
    return () => {
      set.delete(listener as unknown as BivariantListener<S[keyof S]>);
      if (set.size === 0) keyListeners.delete(key);
    };
  };

  const subscribeWithSelector = <T>(
    selector: (state: S) => T,
    listener: (selected: T) => void
  ) => {
    const entry: SelectorEntry<T> = {
      selector,
      listener: listener as BivariantListener<T>,
      lastValue: selector(state),
    };
    selectorListeners.add(entry as unknown as SelectorEntry<unknown>);
    return () => {
      selectorListeners.delete(entry as unknown as SelectorEntry<unknown>);
    };
  };

  return {
    getState,
    dispatch,
    subscribe,
    subscribeToKey,
    subscribeWithSelector,
  };
}
