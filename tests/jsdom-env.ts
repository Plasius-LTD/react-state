import vm from "node:vm";
import { builtinEnvironments } from "vitest/environments";

/**
 * Vitest + jsdom crash in this environment because `vm.constants` is undefined,
 * so jsdom cannot read `DONT_CONTEXTIFY`. Patch the missing constants before
 * spinning up the JSDOM environment.
 */
function ensureVmConstants() {
  const existing = (vm as unknown as { constants?: Record<string, unknown> }).constants ?? {};
  if (typeof existing.DONT_CONTEXTIFY === "undefined") {
    const patched = { ...existing, DONT_CONTEXTIFY: {} };
    try {
      Object.defineProperty(vm, "constants", { value: patched });
    } catch {
      // Fallback for readonly property shapes.
      (vm as unknown as { constants: Record<string, unknown> }).constants = patched;
    }
  }
}

const base = builtinEnvironments.jsdom;

export default {
  ...base,
  async setupVM(...args: any[]) {
    ensureVmConstants();
    // @ts-expect-error Vitest calls with correct args internally
    return base.setupVM?.(...args);
  },
  async setup(global: typeof globalThis, ...rest: any[]) {
    ensureVmConstants();
    // @ts-expect-error Vitest calls with correct args internally
    return base.setup(global, ...rest);
  },
};
