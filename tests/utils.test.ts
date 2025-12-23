import { describe, it, expect } from "vitest";
import { deepFreeze } from "../src/freeze";
import { MetadataStore } from "../src/metadata-store";

describe("deepFreeze", () => {
  it("freezes nested symbol properties without infinite recursion", () => {
    const sym = Symbol("meta");
    const obj: any = { nested: { value: 1 } };
    obj[sym] = { inner: { flag: true } };
    obj.self = obj; // cycle should be ignored

    deepFreeze(obj);

    expect(Object.isFrozen(obj)).toBe(true);
    expect(Object.isFrozen(obj[sym])).toBe(true);
    expect(Object.isFrozen(obj[sym].inner)).toBe(true);
  });
});

describe("MetadataStore", () => {
  it("stores and retrieves non-enumerable metadata", () => {
    const store = new MetadataStore<{ id: number }, { role: string }>("user-meta");
    const target = { id: 1 };

    expect(store.has(target)).toBe(false);
    expect(store.get(target)).toBeUndefined();

    store.set(target, { role: "admin" });

    expect(store.has(target)).toBe(true);
    expect(store.get(target)).toEqual({ role: "admin" });
    expect(Object.keys(target)).not.toContain("role");
  });
});
