const dataset = new WeakSet();

export function useHydrate<T extends object>(data: T, update: () => void): void {
  if (!dataset.has(data)) {
    dataset.add(data);
    update();
  }
}
