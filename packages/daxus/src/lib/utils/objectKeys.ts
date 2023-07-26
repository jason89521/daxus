type Source = Record<string, unknown>;

export function objectKeys<S extends Source>(source: S): (keyof typeof source)[] {
  return Object.keys(source);
}
