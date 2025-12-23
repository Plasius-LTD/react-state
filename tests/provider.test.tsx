import "@testing-library/jest-dom";
import { render, screen, act } from "@testing-library/react";
import React from "react";
import { createStore } from "../src/store";
import { StoreProvider, useDispatch, useStore } from "../src/provider";

type State = { count: number; label?: string };
type Action =
  | { type: "inc" }
  | { type: "set"; value: number }
  | { type: "label"; value: string };

const reducer = (s: State, a: Action): State => {
  switch (a.type) {
    case "inc":
      return { ...s, count: s.count + 1 };
    case "set":
      return { ...s, count: a.value };
    case "label":
      return { ...s, label: a.value };
    default:
      return s;
  }
};

function CounterView() {
  const state = useStore<State>();
  const dispatch = useDispatch<Action>();

  return (
    <div>
      <div aria-label="count">{state.count}</div>
      <div aria-label="label">{state.label ?? "unset"}</div>
      <button onClick={() => dispatch({ type: "inc" })}>inc</button>
      <button onClick={() => dispatch({ type: "label", value: "ok" })}>
        set label
      </button>
    </div>
  );
}

describe("StoreProvider + hooks", () => {
  it("provides state and dispatch updates subscribers", () => {
    const store = createStore<State, Action>(reducer, { count: 0 });
    render(
      <StoreProvider store={store}>
        <CounterView />
      </StoreProvider>
    );

    expect(screen.getByLabelText("count")).toHaveTextContent("0");
    act(() => screen.getByText("inc").click());
    expect(screen.getByLabelText("count")).toHaveTextContent("1");

    act(() => screen.getByText("set label").click());
    expect(screen.getByLabelText("label")).toHaveTextContent("ok");
  });

  it("throws if hooks are used without a provider", () => {
    const Broken = () => {
      useStore<State>();
      return null;
    };
    expect(() => render(<Broken />)).toThrow(
      "StoreProvider is missing in the React tree"
    );
  });
});
