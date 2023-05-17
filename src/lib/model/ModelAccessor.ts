export type Status = {
  isFetching: boolean;
};

export class ModelAccessor {
  protected cache: Status = { isFetching: false };
  protected statusListeners: ((prev: Status, current: Status) => void)[] = [];
  protected dataListeners: (() => void)[] = [];

  protected updateCache = (partialCache: Partial<Status>) => {
    const newCache = { ...this.cache, ...partialCache };
    this.notifyStatusListeners(newCache);
    this.cache = newCache;
    this.notifyDataListeners();
  };

  protected notifyStatusListeners = (newCache: Status) => {
    this.statusListeners.forEach(l => l(this.cache, newCache));
  };

  notifyDataListeners = () => {
    this.dataListeners.forEach(l => l());
  };

  subscribe = (listener: (prev: Status, current: Status) => void) => {
    this.statusListeners.push(listener);
    return () => {
      const index = this.statusListeners.indexOf(listener);
      this.statusListeners.splice(index, 1);
    };
  };

  subscribeData = (listener: () => void) => {
    this.dataListeners.push(listener);
    return () => {
      const index = this.dataListeners.indexOf(listener);
      this.dataListeners.splice(index, 1);
    };
  };

  getCache = () => {
    return this.cache;
  };
}
