export type Cache<Data> = {
  data: Data;
  isFetching: boolean;
};

export class ModelAccessor<Data> {
  protected cache: Cache<Data>;
  protected listeners: ((prev: Cache<Data>, current: Cache<Data>) => void)[] = [];

  constructor(initialCache: Cache<Data>) {
    this.cache = initialCache;
  }

  protected updateCache = (partialCache: Partial<Cache<Data>>) => {
    const newCache = { ...this.cache, ...partialCache };
    this.notifyListeners(newCache);
    this.cache = newCache;
  };

  protected notifyListeners = (newCache: Cache<Data>) => {
    this.listeners.forEach(l => l(this.cache, newCache));
  };

  subscribe = (listener: (prev: Cache<Data>, current: Cache<Data>) => void) => {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      this.listeners.splice(index, 1);
    };
  };
}
