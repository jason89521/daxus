import type { NormalAction } from './types';
import type { Draft } from 'immer';

export class ModelAccessor<M, Arg, RD> {
  private listeners: (() => void)[] = [];
  private status = {
    isLoading: false,
    /** Whether there is an ongoing request. */
    isFetching: false,
    hasFetched: false,
    isValidating: false,
    isError: false,
  };
  private action: NormalAction<M, Arg, RD>;
  private arg: Arg;
  private updateModel: (cb: (model: Draft<M>) => void) => void;
  private revalidateOnFocusCount = 0;
  private revalidateOnReconnectCount = 0;

  getModel: () => M;

  constructor(
    arg: Arg,
    action: NormalAction<M, Arg, RD>,
    updateModel: (cb: (model: Draft<M>) => void) => void,
    getModel: () => M
  ) {
    this.action = action;
    this.arg = arg;
    this.updateModel = updateModel;
    this.getModel = getModel;
  }

  private updateStatus = (newStatus: Partial<typeof this.status>) => {
    this.status = { ...this.status, ...newStatus };
    this.notifyListeners();
  };

  private notifyListeners = () => {
    this.listeners.forEach(l => l());
  };

  private internalFetch = async (retryCount: number) => {
    const result: { remoteData: RD | null; error: unknown } = { remoteData: null, error: null };
    for (let i = 0; i < retryCount; i++) {
      try {
        const remoteData = await this.action.fetchData(this.arg);
        result.remoteData = remoteData;
        return result;
      } catch (error) {
        result.error = error;
      }
    }

    return result;
  };

  private revalidate = () => {
    this.fetch();
  };

  subscribe = (listener: () => void) => {
    this.listeners.push(listener);
    return () => {
      this.listeners.splice(this.listeners.indexOf(listener), 1);
    };
  };

  getStatusSnapshot = () => {
    return this.status;
  };

  fetch = async ({ retryCount = 3 }: { retryCount?: number } = {}) => {
    if (this.status.isFetching) return;
    if (this.status.hasFetched) {
      this.updateStatus({ isValidating: true, isFetching: true });
    } else {
      this.updateStatus({ isLoading: true, isFetching: true });
    }

    const { remoteData, error } = await this.internalFetch(retryCount);
    if (remoteData) {
      this.updateModel(async draft => {
        this.action.syncModel(draft, { remoteData, arg: this.arg });
      });
      this.updateStatus({
        isFetching: false,
        isLoading: false,
        isValidating: false,
        hasFetched: true,
        isError: false,
      });
    } else {
      this.action.onError?.({ error, arg: this.arg });
      this.updateStatus({
        isFetching: false,
        isLoading: false,
        isValidating: false,
        isError: true,
      });
    }
  };

  registerRevalidateOnFocus = () => {
    this.revalidateOnFocusCount += 1;
    if (this.revalidateOnFocusCount === 1) {
      window.addEventListener('focus', this.revalidate);
    }

    return () => {
      this.revalidateOnFocusCount -= 1;
      if (this.revalidateOnFocusCount === 0) {
        window.removeEventListener('focus', this.revalidate);
      }
    };
  };

  registerRevalidateOnReconnect = () => {
    this.revalidateOnReconnectCount += 1;
    if (this.revalidateOnFocusCount === 1) {
      window.addEventListener('online', this.revalidate);
    }

    return () => {
      this.revalidateOnReconnectCount -= 1;
      if (this.revalidateOnReconnectCount === 0) {
        window.removeEventListener('online', this.revalidate);
      }
    };
  };

  mutate = (mutateFn: (state: Draft<M>) => void) => {
    this.updateModel(draft => {
      mutateFn(draft);
    });
    this.notifyListeners();
  };
}
