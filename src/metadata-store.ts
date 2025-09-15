// metadata-store.ts
export class MetadataStore<T extends object, Meta extends object> {
  private readonly symbol: symbol;

  constructor(description: string) {
    this.symbol = Symbol(description);
  }

  set(target: T, meta: Meta) {
    Object.defineProperty(target, this.symbol as PropertyKey, {
      value: meta,
      writable: false,
      enumerable: false,
    });
  }

  get(target: T): Meta | undefined {
    return (target as Record<PropertyKey, Meta>)[this.symbol as PropertyKey];
  }

  has(target: T): boolean {
    return (this.symbol as PropertyKey) in target;
  }
}
