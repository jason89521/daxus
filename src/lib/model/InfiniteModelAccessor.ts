import type { InfiniteAction, Listener } from './types';
import type { Draft } from 'immer';

export class InfiniteModelAccessor<M, Arg, RD> {
  private listeners: Listener[] = [];
  private status = {
    isFetching: false,
  };
  private action: InfiniteAction<M, Arg, RD>;
  private arg: Arg;
  private updateModel: (cb: (draft: Draft<M>) => void) => void;

  private cachedData: RD[] = [];

  getLatestModel: () => M;

  constructor(
    arg: Arg,
    action: InfiniteAction<M, Arg, RD>,
    updateModel: (cb: (draft: Draft<M>) => void) => void,
    getLatestModel: () => M
  ) {
    this.arg = arg;
    this.action = action;
    this.updateModel = updateModel;
    this.getLatestModel = getLatestModel;
  }

  private updateStatus = (newStatus: Partial<typeof this.status>) => {
    this.status = { ...this.status, ...newStatus };
    this.notifyListeners();
  };

  private notifyListeners = () => {
    this.listeners.forEach(l => l());
  };

  /**
   * Update `this.cachedData`.
   * - `pageSize` should be larger than `this.pageSize()`, otherwise `this.cachedData` will not update.
   * - `pageIndex` default is `this.pageSize()`.
   */
  private updateCachedData = async ({
    pageSize,
    pageIndex = this.pageSize(),
  }: {
    pageSize: number;
    pageIndex?: number;
  }) => {
    let previousData: RD | null = this.cachedData[pageIndex - 1] ?? null;
    for (; pageIndex < pageSize; pageIndex++) {
      const remoteData = await this.action.fetchData(this.arg, { previousData, pageIndex });
      previousData = remoteData;
      this.cachedData[pageIndex] = previousData;
    }
  };

  /**
   * Sync the data in `this.cachedData` from the `start` index to the model,
   * and notify the listeners which are listening this accessor.
   */
  private flush = ({ start }: { start: number }) => {
    this.cachedData.forEach((remoteData, pageIndex) => {
      if (pageIndex < start) return;
      this.updateModel(draft => {
        this.action.syncModel(draft, {
          remoteData,
          arg: this.arg,
          pageIndex,
          pageSize: this.pageSize(),
        });
      });
    });
    this.notifyListeners();
  };

  pageSize = () => {
    return this.cachedData.length;
  };

  subscribe = (listener: Listener) => {
    this.listeners.push(listener);
    return () => {
      this.listeners.splice(this.listeners.indexOf(listener), 1);
    };
  };

  validate = async () => {
    if (this.status.isFetching) return;

    this.updateStatus({ isFetching: true });
    await this.updateCachedData({ pageSize: this.pageSize(), pageIndex: 0 });
    this.flush({ start: 0 });
    this.updateStatus({ isFetching: false });
  };

  fetch = async ({ pageSize }: { pageSize: number }) => {
    if (this.status.isFetching) return;
    if (pageSize < 1) throw new Error(`Page size cannot be less than 1: ${pageSize}`);
    if (pageSize <= this.pageSize()) return;

    this.updateStatus({ isFetching: true });

    const start = this.pageSize();
    await this.updateCachedData({ pageSize });
    this.flush({ start });

    this.updateStatus({ isFetching: false });
  };
}
