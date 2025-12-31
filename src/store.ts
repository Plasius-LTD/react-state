import type { Reducer, Listener } from "./types.js";
import { deepFreeze } from "./freeze.js";

const DEV =
  typeof import.meta !== "undefined"
    ? (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV
    : process.env.NODE_ENV !== "production";

// Lightweight DEV-only tracker
function devTrack(name: string, props?: Record<string, unknown>) {
  if (!DEV) return;
  try {
    const t = (globalThis as any)?.track;
    if (typeof t === "function") t(name, props);
  } catch {}
}

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
    listener: (selected: T) => void,
    isEqual?: (a: T, b: T) => boolean
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
    isEqual?: (a: T, b: T) => boolean;
  }
  const selectorListeners = new Set<SelectorEntry<unknown>>();

  const getState = () => state;

  const dispatch = (action: A) => {
    const prevState = state;
    const nextState = reducer(state, action);

    if (DEV) deepFreeze(nextState);

    // Track the inbound action
    devTrack("store:dispatch", { type: action?.type });

    // Distinct-until-changed: if the reducer returns the same reference,
    // skip all notifications (prevents unnecessary re-renders).
    if (Object.is(prevState, nextState)) {
      state = nextState; // keep any identity guarantees from reducer
      devTrack("store:no-op", { type: action?.type });
      return;
    }

    state = nextState;

    // Compute changed keys (shallow) for diagnostics
    let changedKeys: (keyof S)[] | undefined;
    if (DEV) {
      changedKeys = Object.keys(nextState as Record<string, unknown>)
        .filter((k) => !Object.is((prevState as any)[k], (nextState as any)[k])) as (keyof S)[];
      devTrack("store:state-changed", { type: action?.type, changedKeys });
    }

    // Notify global listeners (iterate over a snapshot so unsubscribe during
    // notify does not skip the next listener)
    const globalSnapshot = [...listeners];
    devTrack("store:notify:all", { listeners: globalSnapshot.length });
    let firstError: unknown;
    for (const listener of globalSnapshot) {
      try {
        listener();
      } catch (err) {
        if (!firstError) firstError = err;
      }
    }

    // Notify key listeners only when that key actually changed (Object.is)
    for (const [key, set] of keyListeners.entries()) {
      if (!Object.is(prevState[key], state[key])) {
        devTrack("store:notify:key", { key: String(key), listeners: set.size });
        for (const listener of [...set]) {
          try {
            listener(state[key]);
          } catch (err) {
            if (!firstError) firstError = err;
          }
        }
      }
    }

    // Notify selector listeners only when selected value changed (Object.is)
    let selNotifies = 0;
    for (const entry of [...selectorListeners]) {
      const nextValue = (entry.selector as (s: S) => unknown)(state);
      const equal = (entry.isEqual as ((a: unknown, b: unknown) => boolean) | undefined) ?? Object.is;
      let isSame = false;
      try {
        isSame = equal(entry.lastValue, nextValue);
      } catch (err) {
        if (!firstError) firstError = err;
        continue;
      }
      if (!isSame) {
        entry.lastValue = nextValue as unknown;
        try {
          (entry.listener as (v: unknown) => void)(nextValue);
        } catch (err) {
          if (!firstError) firstError = err;
        }
        selNotifies++;
      }
    }
    devTrack("store:notify:selector", { listeners: selNotifies });
    if (firstError) throw firstError;
  };

  const subscribe = (listener: Listener) => {
    listeners.add(listener);
    devTrack("store:sub:all:add", { size: listeners.size });
    return () => {
      listeners.delete(listener);
      devTrack("store:sub:all:remove", { size: listeners.size });
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
    devTrack("store:sub:key:add", { key: String(key), size: set.size });
    return () => {
      set.delete(listener as unknown as BivariantListener<S[keyof S]>);
      if (set.size === 0) keyListeners.delete(key);
      devTrack("store:sub:key:remove", { key: String(key), size: set.size });
    };
  };

  const subscribeWithSelector = <T>(
    selector: (state: S) => T,
    listener: (selected: T) => void,
    isEqual?: (a: T, b: T) => boolean
  ) => {
    const entry: SelectorEntry<T> = {
      selector,
      listener: listener as BivariantListener<T>,
      lastValue: selector(state),
      isEqual,
    };
    selectorListeners.add(entry as unknown as SelectorEntry<unknown>);
    devTrack("store:sub:selector:add", { size: selectorListeners.size });
    return () => {
      selectorListeners.delete(entry as unknown as SelectorEntry<unknown>);
      devTrack("store:sub:selector:remove", { size: selectorListeners.size });
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
