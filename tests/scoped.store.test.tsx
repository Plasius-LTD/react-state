// tests/setup.ts
import "@testing-library/jest-dom";
import { act, render, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { createScopedStoreContext } from "../src";

describe("scoped store", () => {
  const initialState = { count: 0 };
  const reducer = (
    state: typeof initialState,
    action: { type: string; payload?: number }
  ) => {
    switch (action.type) {
      case "inc":
        return { count: state.count + 1 };
      case "dec":
        return { count: state.count - 1 };
      case "set":
        return { count: action.payload ?? state.count };
      default:
        return state;
    }
  };

  const store = createScopedStoreContext(reducer, initialState);

  const Counter = () => {
    const state = store.useStore();
    const dispatch = store.useDispatch();

    return (
      <div>
        <button id="counter-inc" onClick={() => dispatch({ type: "inc" })}>
          +
        </button>
        <button id="counter-dec" onClick={() => dispatch({ type: "dec" })}>
          -
        </button>
        <input
          aria-label="Counter value"
          title=""
          id="counter-set"
          type="number"
          value={state.count}
          onChange={(e) =>
            dispatch({ type: "set", payload: Number(e.target.value) })
          }
        />
      </div>
    );
  };

  it("increments, decrements, and sets the counter correctly", async () => {
    const { getByText, getByLabelText } = render(
      <store.Provider>
        <Counter />
      </store.Provider>
    );

    const incButton = getByText("+");
    const decButton = getByText("-");
    const input = getByLabelText("Counter value") as HTMLInputElement;

    expect(input.value).toBe("0");

    fireEvent.click(incButton);
    await act(async () => {});
    expect(input.value).toBe("1");

    fireEvent.click(decButton);
    await act(async () => {});
    expect(input.value).toBe("0");

    fireEvent.change(input, { target: { value: "5" } });
    await act(async () => {});
    expect(input.value).toBe("5");
  });
});
