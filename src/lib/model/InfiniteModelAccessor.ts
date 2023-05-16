import { stableHash } from '../utils';
import type { InfiniteAction, Listener } from './types';
import type { Draft } from 'immer';

export type Cache<D> = {
  isFetching: boolean;
  data: D[];
};

export class InfiniteModelAccessor<M, Arg, RD> {
  private listeners: Listener[] = [];
  private action: InfiniteAction<M, Arg, RD>;
  private arg: Arg;
  private updateModel: (cb: (draft: Draft<M>) => void) => void;
  private cache: Cache<RD> = {
    isFetching: false,
    data: [],
  };

  getModel: () => M;

  constructor(
    arg: Arg,
    action: InfiniteAction<M, Arg, RD>,
    updateModel: (cb: (draft: Draft<M>) => void) => void,
    getModel: () => M
  ) {
    this.arg = arg;
    this.action = action;
    this.updateModel = updateModel;
    this.getModel = getModel;
  }

  private updateCache = (newCache: Partial<Cache<RD>>) => {
    this.cache = { ...this.cache, ...newCache };
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
    let previousData: RD | null = this.cache.data[pageIndex - 1] ?? null;
    for (; pageIndex < pageSize; pageIndex++) {
      const remoteData = await this.action.fetchData(this.arg, { previousData, pageIndex });
      if (!remoteData) {
        return;
      }
      previousData = remoteData;
      this.cache.data[pageIndex] = previousData;
    }
  };

  /**
   * Sync the data in `this.cachedData` from the `start` index to the model,
   * and notify the listeners which are listening this accessor.
   */
  private flush = ({ start }: { start: number }) => {
    this.cache.data.forEach((data, pageIndex) => {
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
    this.notifyListeners();
  };

  pageSize = () => {
    return this.cache.data.length;
  };

  subscribe = (listener: Listener) => {
    this.listeners.push(listener);
    return () => {
      this.listeners.splice(this.listeners.indexOf(listener), 1);
    };
  };

  revalidate = async () => {
    if (this.cache.isFetching) return;

    this.updateCache({ isFetching: true });
    const pageSize = this.pageSize() || 1;
    const oldCachedData = this.cache.data;
    this.cache.data = [];
    await this.updateCachedData({ pageSize, pageIndex: 0 });
    if (stableHash(oldCachedData) !== stableHash(this.cache.data)) {
      this.flush({ start: 0 });
    }
    this.updateCache({ isFetching: false });
  };

  fetchNext = async () => {
    if (this.cache.isFetching) return;

    this.updateCache({ isFetching: true });
    const start = this.pageSize();
    await this.updateCachedData({ pageSize: start + 1 });
    this.flush({ start });
    this.updateCache({ isFetching: false });
  };
}
