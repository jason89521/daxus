import type { Action } from './types';
import type { Draft } from 'immer';

export class ModelAccessor<M, Arg, RD> {
  private listeners: (() => void)[] = [];
  private status = {
    isLoading: false,
    /** Whether there is an ongoing request. */
    isFetching: false,
    hasFetched: false,
    isValidating: false,
  };
  private action: Action<M, Arg, RD>;
  private arg: Arg;
  private updateModel: (cb: (model: Draft<M>) => Promise<void>) => Promise<void>;
  private revalidateOnFocusCount = 0;

  getLatestModel: () => M;

  constructor(
    arg: Arg,
    action: Action<M, Arg, RD>,
    updateModel: (cb: (model: Draft<M>) => Promise<void>) => Promise<void>,
    getLatestModel: () => M
  ) {
    this.action = action;
    this.arg = arg;
    this.updateModel = updateModel;
    this.getLatestModel = getLatestModel;
  }

  private mutateStatus = (newInfo: Partial<typeof this.status>) => {
    this.status = { ...this.status, ...newInfo };
    this.notifyListeners();
  };

  private notifyListeners = () => {
    this.listeners.forEach(l => l());
  };

  private handleWindowFocus = () => {
    this.fetch();
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
      this.mutateStatus({ isValidating: true, isFetching: true });
    } else {
      this.mutateStatus({ isLoading: true, isFetching: true });
    }

    const { remoteData, error } = await this.internalFetch(retryCount);
    if (remoteData) {
      this.updateModel(async draft => {
        this.action.syncModel(draft, { remoteData, arg: this.arg });
      });
      this.mutateStatus({
        isFetching: false,
        isLoading: false,
        isValidating: false,
        hasFetched: true,
      });
    } else {
      this.action.onError?.({ error, arg: this.arg });
    }
  };

  registerRevalidateOnFocus = () => {
    this.revalidateOnFocusCount += 1;
    if (this.revalidateOnFocusCount === 1) {
      window.addEventListener('focus', this.handleWindowFocus);
    }

    return () => {
      this.revalidateOnFocusCount -= 1;
      if (this.revalidateOnFocusCount === 0) {
        window.removeEventListener('focus', this.handleWindowFocus);
      }
    };
  };

  mutate = async (mutateFn: (state: Draft<M>) => Promise<void>) => {
    await this.updateModel(async draft => {
      await mutateFn(draft);
    });
    this.notifyListeners();
  };
}
