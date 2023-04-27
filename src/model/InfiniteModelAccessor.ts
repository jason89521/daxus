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

  private pageSize = 0;
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

  fetch = async ({ pageSize }: { pageSize: number }) => {
    if (this.status.isFetching) return;
    if (pageSize < 1) throw new Error(`Page size cannot be less than 1: ${pageSize}`);
    if (pageSize <= this.pageSize) return;

    this.updateStatus({ isFetching: true });

    let pageIndex = this.pageSize;
    let previousData: RD | null = this.cachedData[pageIndex - 1] ?? null;
    for (; pageIndex < pageSize; pageIndex++) {
      const remoteData = await this.action.fetchData(this.arg, previousData);
      this.updateModel(async draft => {
        this.action.syncModel(draft, {
          remoteData,
          arg: this.arg,
          pageSize,
          pageIndex,
        });
      });
      previousData = remoteData;
      this.cachedData[pageIndex] = previousData;
    }

    this.pageSize = pageSize;
    this.updateStatus({ isFetching: false });
  };
}
