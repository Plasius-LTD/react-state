import { createContext, useContext, useRef, useSyncExternalStore } from "react";
import type { IState, IAction, Store } from "./store.js";
import { createStore } from "./store.js";

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

  const store = createStore(reducer, initialState);

  const Provider = ({ children }: { children: React.ReactNode }) => (
    <Context.Provider value={store}>{children}</Context.Provider>
  );

  const useStore = (): S => {
    const ctx = useContext(Context);
    if (!ctx) throw new Error("Store not found in context");
    return useSyncExternalStore(ctx.subscribe, ctx.getState, ctx.getState);
  };

  const useDispatch = (): ((action: A) => void) => {
    const ctx = useContext(Context);
    if (!ctx) throw new Error("Dispatch not found in context");
    return (action: A) => ctx.dispatch(action);
  };

  function useSelector<T>(
    selector: (state: S) => T,
    isEqual: (a: T, b: T) => boolean = shallowEqual
  ): T {
    const ctx = useContext(Context);
    if (!ctx) throw new Error("Store not found in context");

    // Subscribe to the raw state snapshot (stable reference until a dispatch)
    const state = useSyncExternalStore(
      ctx.subscribe,
      ctx.getState,
      ctx.getState
    );

    // Cache the selected slice per state snapshot to avoid returning fresh objects during render
    const lastRef = useRef<{ state: S; selected: T } | null>(null);
    const last = lastRef.current;
    const nextSelected = selector(state);

    if (last && last.state === state && isEqual(last.selected, nextSelected)) {
      return last.selected; // return cached reference to satisfy getSnapshot caching
    }

    lastRef.current = { state, selected: nextSelected };
    return nextSelected;
  }

  return {
    store,
    Context,
    Provider,
    useStore,
    useDispatch,
    useSelector,
  };
}
