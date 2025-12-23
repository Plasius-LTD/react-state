import React, { createContext, useContext, useEffect, useSyncExternalStore } from "react";
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
  return useSyncExternalStore(
    (onStoreChange) => {
      devTrack("store:react:subscribe");
      const unsubscribe = store.subscribe(() => {
        devTrack("store:react:notify");
        onStoreChange();
      });
      return () => {
        devTrack("store:react:unsubscribe");
        unsubscribe();
      };
    },
    store.getState,
    store.getState
  );
}

export function useDispatch<A extends IAction>(): Store<IState, A>["dispatch"] {
  const store = useStoreInstance<IState, A>();
  // Return the store's dispatch directly; consumers can call dispatch(action).
  return store.dispatch as Store<IState, A>["dispatch"];
}
