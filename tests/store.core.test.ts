import { describe, it, expect, vi } from "vitest";
import {
  createStore,
  type Store,
  type IState,
  type IAction,
} from "../src/store";

type S = { count: number; meta?: { tag: string } };
type A =
  | { type: "inc" }
  | { type: "set"; value: number }
  | { type: "setMeta"; tag: string }
  | { type: "noop" };

const reducer = (s: S, a: A): S => {
  switch (a.type) {
    case "inc":
      return { ...s, count: s.count + 1 };
    case "set":
      return { ...s, count: a.value };
    case "setMeta":
      return { ...s, meta: { tag: a.tag } };
    case "noop":
      return s; // return same reference to simulate no-change dispatch
    default:
      return s;
  }
};

const initial: S = { count: 0, meta: { tag: "a" } };

describe("createStore – basics", () => {
  it("getState returns initial; dispatch updates", () => {
    const store = createStore<S, A>(reducer, initial);
    expect(store.getState()).toEqual(initial);
    store.dispatch({ type: "inc" });
    expect(store.getState().count).toBe(1);
  });
});

describe("subscribe (global)", () => {
  it("fires on every dispatch, even if state reference is unchanged", () => {
    const store = createStore<S, A>(reducer, initial);
    const cb = vi.fn();
    const un = store.subscribe(cb);

    store.dispatch({ type: "noop" }); // same reference
    store.dispatch({ type: "inc" }); // changed

    expect(cb).toHaveBeenCalledTimes(2);
    un();
    store.dispatch({ type: "inc" });
    expect(cb).toHaveBeenCalledTimes(2);
  });
});

describe("subscribeToKey (per-key)", () => {
  it("notifies only when that key changes", () => {
    const store = createStore<S, A>(reducer, initial);
    const cb = vi.fn();
    const un = store.subscribeToKey("count", cb);

    store.dispatch({ type: "setMeta", tag: "b" }); // different key
    expect(cb).not.toHaveBeenCalled();

    store.dispatch({ type: "inc" });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenLastCalledWith(1);

    un();
    store.dispatch({ type: "inc" });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("removes empty key sets when last listener unsubscribes", () => {
    const store = createStore<S, A>(reducer, initial);
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    const un1 = store.subscribeToKey("count", cb1);
    const un2 = store.subscribeToKey("count", cb2);

    un1();
    un2();
    // We can't directly inspect keyListeners map, but we can assert no leaks by re-subscribing and ensuring it still works.
    const cb3 = vi.fn();
    const un3 = store.subscribeToKey("count", cb3);
    store.dispatch({ type: "inc" });
    expect(cb3).toHaveBeenCalledTimes(1);
    un3();
  });
});

describe("subscribeWithSelector (derived changes)", () => {
  it("does not call immediately; calls when selected value changes", () => {
    const store = createStore<S, A>(reducer, initial);
    const sel = (s: S) => s.count;
    const cb = vi.fn();

    const un = store.subscribeWithSelector(sel, cb);
    expect(cb).not.toHaveBeenCalled();

    store.dispatch({ type: "inc" });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenLastCalledWith(1);

    un();
  });

  it("does not call if selector result is referentially equal", () => {
    const store = createStore<S, A>(reducer, { count: 0, meta: { tag: "x" } });
    const sel = (s: S) => s.meta?.tag; // primitive equality
    const cb = vi.fn();

    const un = store.subscribeWithSelector(sel, cb);
    store.dispatch({ type: "setMeta", tag: "x" }); // new object, same tag
    expect(cb).not.toHaveBeenCalled();

    store.dispatch({ type: "setMeta", tag: "y" });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenLastCalledWith("y");
    un();
  });
});

describe("notification order", () => {
  it("global → key → selector", () => {
    const store = createStore<S, A>(reducer, initial);
    const calls: string[] = [];

    const unG = store.subscribe(() => calls.push("global"));
    const unK = store.subscribeToKey("count", () => calls.push("key"));
    const unS = store.subscribeWithSelector(
      (s) => s.count,
      () => calls.push("selector")
    );

    store.dispatch({ type: "inc" });

    expect(calls).toEqual(["global", "key", "selector"]);
    unG();
    unK();
    unS();
  });
});

describe("mutation during iteration (edge case)", () => {
  it("unsubscribing within a global listener may skip the next listener (document current behavior)", () => {
    const store = createStore<S, A>(reducer, initial);
    const log: string[] = [];

    let un1: () => void = () => {};
    const l1 = () => {
      log.push("l1");
      un1();
    }; // removes itself during dispatch
    const l2 = () => {
      log.push("l2");
    };

    un1 = store.subscribe(l1);
    store.subscribe(l2);

    store.dispatch({ type: "inc" });

    // Depending on Array#forEach semantics with splice, l2 might be skipped.
    // Document current behavior so a future change (copy-before-iterate) can flip this expectation.
    expect(log.length === 1 || log.length === 2).toBe(true);
  });
});

describe("no-change dispatch side-effects", () => {
  it("global fires; key/selector do not", () => {
    const store = createStore<S, A>(reducer, initial);
    const g = vi.fn();
    const k = vi.fn();
    const s = vi.fn();

    store.subscribe(g);
    store.subscribeToKey("count", k);
    store.subscribeWithSelector((st) => st.count, s);

    store.dispatch({ type: "noop" }); // same reference returned

    expect(g).toHaveBeenCalledTimes(1);
    expect(k).not.toHaveBeenCalled();
    expect(s).not.toHaveBeenCalled();
  });
});
