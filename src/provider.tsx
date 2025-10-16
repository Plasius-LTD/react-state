import React, { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Store, IState, IAction } from "./store.js";

// DEV-only tracking (no-op in production)
const __DEV__ = typeof process !== "undefined" ? process.env.NODE_ENV !== "production" : true;
function devTrack(name: string, props?: Record<string, unknown>) {
  if (!__DEV__) return;
  try {
    const t = (globalThis as any)?.track;
    if (typeof t === "function") t(name, props);
  } catch {}
}

const StoreContext = createContext<Store<IState, IAction> | undefined>(undefined);

function useStoreInstance<S extends IState, A extends IAction>(): Store<S, A> {
  const store = useContext(StoreContext) as Store<S, A> | undefined;
  if (!store) {
    devTrack("store:provider:missing");
    throw new Error(
      "StoreProvider is missing in the React tree. Wrap your app with <StoreProvider store={...}>."
    );
  }
  return store;
}

interface StoreProviderProps<S extends IState, A extends IAction> {
  store: Store<S, A>;
  children: ReactNode;
}

export function StoreProvider<S extends IState, A extends IAction>({
  store,
  children,
}: StoreProviderProps<S, A>) {
  useEffect(() => {
    devTrack("store:provider:mount", { hasStore: !!store });
    return () => devTrack("store:provider:unmount");
  }, [store]);
  return (
    <StoreContext.Provider value={store as unknown as Store<IState, IAction>}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore<S extends IState>(): S {
  const store = useStoreInstance<S, IAction>();
  const [state, setState] = useState<S>(() => store.getState());
  const prevRef = React.useRef<S>(state);

  useEffect(() => {
    devTrack("store:react:subscribe");
    const unsubscribe = store.subscribe(() => {
      const next = store.getState();
      if (!Object.is(prevRef.current, next)) {
        if (__DEV__) {
          try {
            const prev = prevRef.current as unknown as Record<string, unknown>;
            const cur = next as unknown as Record<string, unknown>;
            const changedKeys = Array.from(
              new Set([...Object.keys(prev || {}), ...Object.keys(cur || {})])
            ).filter((k) => !Object.is(prev?.[k], cur?.[k]));
            devTrack("store:react:update", {
              changed: changedKeys,
              count: changedKeys.length,
            });
          } catch {}
        }
        prevRef.current = next;
        setState(next);
      } else {
        devTrack("store:react:no-op");
      }
    });
    return () => {
      devTrack("store:react:unsubscribe");
      unsubscribe();
    };
  }, [store]);

  return state;
}

export function useDispatch<A extends IAction>(): Store<IState, A>["dispatch"] {
  const store = useStoreInstance<IState, A>();
  // Return the store's dispatch directly; consumers can call dispatch(action).
  return store.dispatch as Store<IState, A>["dispatch"];
}
