import type { ModelSubscribe } from './ModelAccessor';
import { ModelAccessor } from './ModelAccessor';
import type { InfiniteAction } from './types';
import type { Draft } from 'immer';

export class InfiniteModelAccessor<M, Arg, RD> extends ModelAccessor<M> {
  private action: InfiniteAction<M, Arg, RD>;
  private arg: Arg;
  private updateModel: (cb: (draft: Draft<M>) => void) => void;
  private data: RD[] = [];

  constructor(
    arg: Arg,
    action: InfiniteAction<M, Arg, RD>,
    updateModel: (cb: (draft: Draft<M>) => void) => void,
    getModel: () => M,
    modelSubscribe: ModelSubscribe
  ) {
    super(getModel, modelSubscribe);
    this.arg = arg;
    this.action = action;
    this.updateModel = updateModel;
    this.getModel = getModel;
  }

  private updateData = (data: RD[]) => {
    this.data = data;
    this.notifyDataListeners();
  };

  /**
   * Update `this.cache.data`.
   * - `pageSize` should be larger than `this.pageSize()`, otherwise `this.cachedData` will not update.
   * - `pageIndex` default is `this.pageSize()`.
   */
  private fetchData = async ({
    pageSize,
    pageIndex = this.pageSize(),
  }: {
    pageSize: number;
    pageIndex?: number;
  }) => {
    const data = [...this.data];
    let previousData: RD | null = data[pageIndex - 1] ?? null;
    for (; pageIndex < pageSize; pageIndex++) {
      const remoteData = await this.action.fetchData(this.arg, { previousData, pageIndex });
      if (!remoteData) {
        break;
      }
      previousData = remoteData;
      data[pageIndex] = previousData;
    }

    return data.slice(0, pageIndex);
  };

  /**
   * Sync the data in `this.cachedData` from the `start` index to the model,
   * and notify the listeners which are listening this accessor.
   */
  private flush = (data: RD[], { start }: { start: number }) => {
    data.forEach((data, pageIndex) => {
      if (pageIndex < start) return;
      this.updateModel(draft => {
        this.action.syncModel(draft, {
          data,
          arg: this.arg,
          pageIndex,
          pageSize: this.pageSize(),
        });
      });
    });
  };

  pageSize = () => {
    return this.data.length;
  };

  revalidate = async () => {
    if (this.status.isFetching) return;

    this.updateCache({ isFetching: true });
    const pageSize = this.pageSize() || 1;
    try {
      const data = await this.fetchData({ pageSize, pageIndex: 0 });
      this.flush(data, { start: 0 });
      this.updateData(data);
    } catch (error) {
      //
    } finally {
      this.updateCache({ isFetching: false });
    }
  };

  fetchNext = async () => {
    if (this.status.isFetching) return;

    this.updateCache({ isFetching: true });
    const start = this.pageSize();
    try {
      const data = await this.fetchData({ pageSize: start + 1 });
      this.flush(data, { start });
      this.updateData(data);
    } catch (error) {
      //
    } finally {
      this.updateCache({ isFetching: false });
    }
  };
}
