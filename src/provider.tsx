import React, { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Store, IState, IAction } from "./store.js";

const StoreContext = createContext<Store<IState, IAction> | undefined>(undefined);

function useStoreInstance<S extends IState, A extends IAction>(): Store<S, A> {
  const store = useContext(StoreContext) as Store<S, A> | undefined;
  if (!store) {
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
  return (
    <StoreContext.Provider value={store as unknown as Store<IState, IAction>}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore<S extends IState>(): S {
  const store = useStoreInstance<S, IAction>();
  const [state, setState] = useState<S>(() => store.getState());

  useEffect(() => {
    // Subscribe to store changes and update local state.
    const unsubscribe = store.subscribe(() => {
      setState(store.getState());
    });
    return unsubscribe;
  }, [store]);

  return state;
}

export function useDispatch<A extends IAction>(): Store<IState, A>["dispatch"] {
  const store = useStoreInstance<IState, A>();
  // Return the store's dispatch directly; consumers can call dispatch(action).
  return store.dispatch as Store<IState, A>["dispatch"];
}
