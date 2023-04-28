import type { InfiniteAction, Listener } from './types';
import type { Draft } from 'immer';

export class InfiniteModelAccessor<M, Arg, RD> {
  private listeners: Listener[] = [];
  private status = {
    isFetching: false,
  };
  private action: InfiniteAction<M, Arg, RD>;
  private arg: Arg;
  private updateModel: (cb: (draft: Draft<M>) => Promise<void>) => Promise<void>;

  private cachedData: RD[] = [];

  getLatestModel: () => M;

  constructor(
    arg: Arg,
    action: InfiniteAction<M, Arg, RD>,
    updateModel: (cb: (draft: Draft<M>) => Promise<void>) => Promise<void>,
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

  private pageSize = () => {
    return this.cachedData.length;
  };

  /**
   * Update `this.cachedData` and `this.pageSize`.
   * - `pageSize` should be larger than `this.pageSize`, otherwise `this.cachedData` will not update.
   * - `pageIndex` default is `this.pageIndex`.
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
      const remoteData = await this.action.fetchData(this.arg, previousData);
      previousData = remoteData;
      this.cachedData[pageIndex] = previousData;
    }
  };

  /**
   * Sync the data in `this.cachedData` to the model.
   */
  private flush = () => {
    const pageSize = this.cachedData.length;
    let pageIndex = 0;
    for (const remoteData of this.cachedData) {
      this.updateModel(async draft => {
        this.action.syncModel(draft, {
          remoteData,
          arg: this.arg,
          pageIndex,
          pageSize,
        });
      });

      pageIndex += 1;
    }
  };

  validate = async () => {
    await this.updateCachedData({ pageSize: this.pageSize(), pageIndex: 0 });
    this.flush();
  };

  fetch = async ({ pageSize }: { pageSize: number }) => {
    if (this.status.isFetching) return;
    if (pageSize < 1) throw new Error(`Page size cannot be less than 1: ${pageSize}`);
    if (pageSize <= this.pageSize()) return;

    this.updateStatus({ isFetching: true });

    await this.updateCachedData({ pageSize });
    this.flush();

    this.updateStatus({ isFetching: false });
  };
}
