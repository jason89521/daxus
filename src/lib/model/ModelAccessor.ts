export type Status = {
  isFetching: boolean;
};

export type ModelSubscribe = (listener: () => void) => () => void;

export class ModelAccessor {
  protected cache: Status = { isFetching: false };
  protected statusListeners: ((prev: Status, current: Status) => void)[] = [];
  protected dataListeners: (() => void)[] = [];
  private modelSubscribe: ModelSubscribe;

  constructor(modelSubscribe: ModelSubscribe) {
    this.modelSubscribe = modelSubscribe;
  }

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
    const modelUnsubscribe = this.modelSubscribe(listener);
    return () => {
      const index = this.dataListeners.indexOf(listener);
      this.dataListeners.splice(index, 1);
      modelUnsubscribe();
    };
  };

  getCache = () => {
    return this.cache;
  };
}
