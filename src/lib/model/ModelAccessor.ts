export type Status = {
  isFetching: boolean;
};

export type ModelSubscribe = (listener: () => void) => () => void;

export class ModelAccessor<M> {
  protected status: Status = { isFetching: false };
  protected statusListeners: ((prev: Status, current: Status) => void)[] = [];
  protected dataListeners: (() => void)[] = [];
  private modelSubscribe: ModelSubscribe;

  getModel: () => M;

  constructor(getModel: () => M, modelSubscribe: ModelSubscribe) {
    this.getModel = getModel;
    this.modelSubscribe = modelSubscribe;
  }

  protected updateCache = (partialCache: Partial<Status>) => {
    const newCache = { ...this.status, ...partialCache };
    this.notifyStatusListeners(newCache);
    this.status = newCache;
    this.notifyDataListeners();
  };

  protected notifyStatusListeners = (newCache: Status) => {
    this.statusListeners.forEach(l => l(this.status, newCache));
  };

  notifyDataListeners = () => {
    this.dataListeners.forEach(l => l());
  };

  subscribeStatus = (listener: (prev: Status, current: Status) => void) => {
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

  getStatus = () => {
    return this.status;
  };
}
