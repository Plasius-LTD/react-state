import { createContext, useContext, useRef, useSyncExternalStore, useCallback, useEffect } from "react";
import type { IState, IAction, Store } from "./store.js";
import { createStore } from "./store.js";

// DEV-only tracking (no-op in production)
const __DEV__ = typeof process !== "undefined" ? process.env.NODE_ENV !== "production" : true;
function devTrack(name: string, props?: Record<string, unknown>) {
  if (!__DEV__) return;
  try {
    const t = (globalThis as any)?.track;
    if (typeof t === "function") t(name, props);
  } catch {}
}

// Local microtask-based batching (no react-dom dependency)
const _queue = new Set<() => void>();
let _queued = false;
const _schedule = typeof queueMicrotask === "function"
  ? queueMicrotask
  : (fn: () => void) => Promise.resolve().then(fn);

function enqueue(fn: () => void) {
  _queue.add(fn);
  if (_queued) return;
  _queued = true;
  _schedule(() => {
    _queued = false;
    const fns = Array.from(_queue);
    _queue.clear();
    for (const f of fns) f();
    devTrack("scoped:batch:flush", { size: fns.length });
  });
}

function makeBatchedSubscribe(subscribe: (l: () => void) => () => void) {
  return (onChange: () => void) => {
    devTrack("scoped:sub:add");
    const wrapped = () => {
      devTrack("scoped:notify:enqueue");
      enqueue(onChange);
    };
    const unsubscribe = subscribe(wrapped);
    return () => {
      devTrack("scoped:sub:remove");
      unsubscribe();
    };
  };
}

function shallowEqual(a: any, b: any) {
  if (Object.is(a, b)) return true;
  if (
    typeof a !== "object" ||
    a === null ||
    typeof b !== "object" ||
    b === null
  )
    return false;
  const ak = Object.keys(a),
    bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (let i = 0; i < ak.length; i++) {
    const k = ak[i] as string;
    if (
      !Object.prototype.hasOwnProperty.call(b, k) ||
      !Object.is((a as any)[k], (b as any)[k])
    )
      return false;
  }
  return true;
}

export function createScopedStoreContext<S extends IState, A extends IAction>(
  reducer: (state: S, action: A) => S,
  initialState: S
) {
  const Context = createContext<Store<S, A> | null>(null);

  // Each Provider instance gets its own store.
  const Provider = ({
    children,
    initialState: override,
  }: {
    children: React.ReactNode;
    initialState?: S;
  }) => {
    const storeRef = useRef<Store<S, A> | null>(null);
    if (!storeRef.current) {
      storeRef.current = createStore(reducer, override ?? initialState);
      devTrack("scoped:store:create");
    }

    useEffect(() => {
      devTrack("scoped:provider:mount");
      return () => devTrack("scoped:provider:unmount");
    }, []);

    return <Context.Provider value={storeRef.current}>{children}</Context.Provider>;
  };

  const useStore = (): S => {
    const ctx = useContext(Context);
    if (!ctx) throw new Error("Store not found in context");
    devTrack("scoped:useStore");
    return useSyncExternalStore(
      makeBatchedSubscribe(ctx.subscribe),
      ctx.getState,
      ctx.getState
    );
  };

  const useDispatch = (): ((action: A) => void) => {
    const ctx = useContext(Context);
    if (!ctx) throw new Error("Dispatch not found in context");
    return useCallback((action: A) => ctx.dispatch(action), [ctx]);
  };

  function useSelector<T>(
    selector: (state: S) => T,
    isEqual: (a: T, b: T) => boolean = shallowEqual
  ): T {
    const ctx = useContext(Context);
    if (!ctx) throw new Error("Store not found in context");

    // Subscribe to the raw state snapshot (stable reference until a dispatch)
    const state = useSyncExternalStore(
      makeBatchedSubscribe(ctx.subscribe),
      ctx.getState,
      ctx.getState
    );

    // Cache the selected slice per state snapshot to avoid returning fresh objects during render
    const lastRef = useRef<{ state: S; selected: T } | null>(null);
    const last = lastRef.current;
    const nextSelected = selector(state);

    if (last && last.state === state && isEqual(last.selected, nextSelected)) {
      devTrack("scoped:selector:cache-hit");
      return last.selected; // return cached reference to satisfy getSnapshot caching
    }

    devTrack("scoped:selector:cache-miss");
    lastRef.current = { state, selected: nextSelected };
    return nextSelected;
  }

  return {
    Context,
    Provider,
    useStore,
    useDispatch,
    useSelector,
  };
}
