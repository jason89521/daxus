export type Status = {
  isFetching: boolean;
};

export type ModelSubscribe = (listener: () => void) => () => void;

export class ModelAccessor<M> {
  protected status: Status = { isFetching: false };
  protected statusListeners: ((prev: Status, current: Status) => void)[] = [];
  protected dataListeners: (() => void)[] = [];
  protected retryCount = 5;
  private modelSubscribe: ModelSubscribe;
  private revalidateOnFocusCount = 0;
  private revalidateOnReconnectCount = 0;

  getModel: () => M;

  constructor(getModel: () => M, modelSubscribe: ModelSubscribe) {
    this.getModel = getModel;
    this.modelSubscribe = modelSubscribe;
  }

  protected updateStatus = (partialStatus: Partial<Status>) => {
    const newStatus = { ...this.status, ...partialStatus };
    this.notifyStatusListeners(newStatus);
    this.status = newStatus;
  };

  protected notifyStatusListeners = (newCache: Status) => {
    this.statusListeners.forEach(l => l(this.status, newCache));
  };

  protected notifyDataListeners = () => {
    this.dataListeners.forEach(l => l());
  };

  registerRevalidateOnFocus(revalidate: () => void) {
    this.revalidateOnFocusCount += 1;
    if (this.revalidateOnFocusCount === 1) {
      window.addEventListener('focus', revalidate);
    }
    return () => {
      this.revalidateOnFocusCount -= 1;
      if (this.revalidateOnFocusCount === 0) {
        window.removeEventListener('focus', revalidate);
      }
    };
  }

  registerRevalidateOnReconnect(revalidate: () => void) {
    this.revalidateOnReconnectCount += 1;
    if (this.revalidateOnReconnectCount === 1) {
      window.addEventListener('online', revalidate);
    }
    return () => {
      this.revalidateOnReconnectCount -= 1;
      if (this.revalidateOnReconnectCount === 0) {
        window.removeEventListener('online', revalidate);
      }
    };
  }

  /**
   * @internal
   * @param listener
   * @returns
   */
  subscribeStatus = (listener: (prev: Status, current: Status) => void) => {
    this.statusListeners.push(listener);
    return () => {
      const index = this.statusListeners.indexOf(listener);
      this.statusListeners.splice(index, 1);
    };
  };

  /**
   * @internal
   * @param listener
   * @returns
   */
  subscribeData = (listener: () => void) => {
    this.dataListeners.push(listener);
    const modelUnsubscribe = this.modelSubscribe(listener);
    return () => {
      const index = this.dataListeners.indexOf(listener);
      this.dataListeners.splice(index, 1);
      modelUnsubscribe();
    };
  };

  setRetryCount = (n: number) => {
    this.retryCount = n;
  };

  getStatus = () => {
    return this.status;
  };
}
