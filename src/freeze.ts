// freeze.ts
export function deepFreeze<T>(obj: T, seen = new WeakSet<object>()): T {
  if (obj === null || typeof obj !== "object") return obj;
  const o = obj as unknown as object;
  if (seen.has(o)) return obj;
  seen.add(o);

  // Freeze children first
  for (const key of Object.getOwnPropertyNames(o)) {
    // @ts-expect-error index access
    const val = (o as any)[key];
    if (val && typeof val === "object") deepFreeze(val, seen);
  }
  // Also handle symbols (rare but safe)
  for (const sym of Object.getOwnPropertySymbols(o)) {
    // @ts-expect-error index access
    const val = (o as any)[sym];
    if (val && typeof val === "object") deepFreeze(val, seen);
  }

  return Object.freeze(obj);
}
