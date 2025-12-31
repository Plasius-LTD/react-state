import "@testing-library/jest-dom";
import { render, screen, act, waitFor, fireEvent } from "@testing-library/react";
import React from "react";
import { beforeEach } from "vitest";
import { createScopedStoreContext } from "../src/create-scoped-store";

type State = { count: number };
type Action = { type: "inc" } | { type: "noop" };

const scoped = createScopedStoreContext(
  (s: State, a: Action) => {
    if (a.type === "inc") return { count: s.count + 1 };
    return s;
  },
  { count: 0 }
);

const seenSelections: Array<{ double: number }> = [];

function SelectionView() {
  const selected = scoped.useSelector(
    (s) => ({ double: s.count * 2 }),
    (a, b) => a.double === b.double
  );

  seenSelections.push(selected);

  return <div aria-label="double">{selected.double}</div>;
}

describe("createScopedStoreContext extras", () => {
  beforeEach(() => {
    seenSelections.length = 0;
  });

  it("memoizes selector results when state is unchanged and refreshes after dispatch", async () => {
    const App = () => {
      const dispatch = scoped.useDispatch();
      const [, force] = React.useState(0);
      return (
        <>
          <SelectionView />
          <div>
            <button onClick={() => dispatch({ type: "inc" })}>inc</button>
            <button onClick={() => force((n) => n + 1)}>rerender</button>
          </div>
        </>
      );
    };

    render(
      <scoped.Provider>
        <App />
      </scoped.Provider>
    );

    expect(screen.getByLabelText("double")).toHaveTextContent("0");

    // Force a re-render without changing store state; selector should reuse reference.
    await act(async () => screen.getByText("rerender").click());
    await waitFor(() => expect(seenSelections).toHaveLength(2));
    expect(seenSelections[0]).toBe(seenSelections[1]);

    // Change store state; selector should return a new reference.
    await act(async () => screen.getByText("inc").click());
    expect(screen.getByLabelText("double")).toHaveTextContent("2");
    await waitFor(() => expect(seenSelections).toHaveLength(3));
    expect(seenSelections[2]).not.toBe(seenSelections[1]);
  });

  it("throws a helpful error when hooks are used without a Provider", () => {
    const Broken = () => {
      scoped.useStore();
      return null;
    };
    expect(() => render(<Broken />)).toThrow("Store not found in context");
  });

  it("does not reset when Provider initialState prop changes (store sticks to first value)", () => {
    const App = ({ initial }: { initial: State }) => (
      <scoped.Provider initialState={initial}>
        <SelectionView />
      </scoped.Provider>
    );

    const { rerender } = render(<App initial={{ count: 1 }} />);
    expect(screen.getByLabelText("double")).toHaveTextContent("2");

    rerender(<App initial={{ count: 5 }} />);
    expect(screen.getByLabelText("double")).toHaveTextContent("10");
  });

  it("batches same-tick dispatch notifications (single render for multiple dispatches)", async () => {
    const batched = createScopedStoreContext(
      (s: State, a: Action) => (a.type === "inc" ? { count: s.count + 1 } : s),
      { count: 0 }
    );
    let renderCount = 0;

    const Counter = () => {
      renderCount++;
      const state = batched.useStore();
      const dispatch = batched.useDispatch();
      return (
        <div>
          <div aria-label="count">{state.count}</div>
          <button onClick={() => dispatch({ type: "inc" })}>inc</button>
        </div>
      );
    };

    render(
      <batched.Provider>
        <Counter />
      </batched.Provider>
    );

    expect(screen.getByLabelText("count")).toHaveTextContent("0");
    expect(renderCount).toBe(1);

    act(() => {
      fireEvent.click(screen.getByText("inc"));
      fireEvent.click(screen.getByText("inc"));
    });

    await waitFor(() => expect(screen.getByLabelText("count")).toHaveTextContent("2"));
    expect(renderCount).toBe(2); // one re-render for the batched flush
  });
});
