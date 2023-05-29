import { getCurrentTime } from '../utils';
import type { ModelSubscribe } from './ModelAccessor';
import { ModelAccessor } from './ModelAccessor';
import type { InfiniteAction } from './types';
import type { Draft } from 'immer';

export class InfiniteModelAccessor<M, Arg = any, RD = any, E = unknown> extends ModelAccessor<
  M,
  E
> {
  private action: InfiniteAction<M, Arg, RD>;
  private arg: Arg;
  private updateModel: (cb: (draft: Draft<M>) => void) => void;
  private data: RD[] = [];
  private isFetchingNextPage = false;
  private rejectFetching: (() => void) | null = null;

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
  }

  /**
   * @internal
   */
  revalidate = async () => {
    const pageSize = this.pageSize() || 1;
    this.fetch({ pageSize, pageIndex: 0 });
  };

  /**
   * @internal
   * @returns
   */
  fetchNext = async () => {
    if (this.isFetchingNextPage) return;
    const pageIndex = this.pageSize();
    const pageSize = pageIndex + 1;
    try {
      this.isFetchingNextPage = true;
      await this.fetch({ pageSize, pageIndex });
    } finally {
      this.isFetchingNextPage = false;
    }
  };

  private updateData = (data: RD[]) => {
    this.data = data;
    this.notifyDataListeners();
  };

  /**
   * Fetch a single page with error retry.
   * @param param0
   * @returns
   */
  private fetchPage = async ({
    previousData,
    pageIndex,
    remainRetryCount,
  }: {
    previousData: RD | null;
    pageIndex: number;
    remainRetryCount: number;
  }): Promise<[RD | null, E | null]> => {
    const arg = this.arg;
    const promise = new Promise<[RD | null, E | null]>((resolve, reject) => {
      this.action
        .fetchData(arg, { previousData, pageIndex })
        .then(value => resolve([value, null]))
        .catch(e => {
          if (remainRetryCount <= 0) {
            resolve([null, e]);
            return;
          }

          const timeoutId = window.setTimeout(() => {
            this.fetchPage({
              previousData,
              pageIndex,
              remainRetryCount: remainRetryCount - 1,
            }).then(resolve);
          }, this.getRetryInterval());
          this.setRetryTimeoutMeta({ timeoutId, reject });
        });
      this.rejectFetching = reject;
    });
    try {
      const result = await promise;
      return result;
    } catch (error) {
      // Happens when the fetching is rejected.
    }

    return [null, null];
  };

  /**
   * Fetch the pages from `pageIndex` to `pageSize` (exclusive).
   * This function returns the whole data list.
   */
  private fetchPages = async ({
    pageSize,
    pageIndex = this.pageSize(),
  }: {
    pageSize: number;
    pageIndex?: number;
  }) => {
    const dataArray = [...this.data];
    const result: [RD[], E | null] = [dataArray, null];
    let previousData: RD | null = dataArray[pageIndex - 1] ?? null;
    for (; pageIndex < pageSize; pageIndex++) {
      const [data, error] = await this.fetchPage({
        previousData,
        pageIndex,
        remainRetryCount: this.getRetryCount(),
      });
      if (error) {
        result[1] = error;
        break;
      }
      if (!data) {
        break;
      }
      previousData = data;
      dataArray[pageIndex] = previousData;
    }

    result[0] = dataArray.slice(0, pageIndex);
    return result;
  };

  private fetch = async ({
    pageIndex = this.pageSize(),
    pageSize,
  }: {
    pageIndex?: number;
    pageSize: number;
  }) => {
    const currentTime = getCurrentTime();
    // If page size is larger than current page size,
    // then we can determine that this fetch is trying to fetch the next page
    if (!this.canFetch({ currentTime }) && pageSize <= this.pageSize()) return;

    this.abortRetry();
    this.rejectFetching?.();
    this.updateStartAt(currentTime);

    this.updateStatus({ isFetching: true });
    const arg = this.arg;
    const [data, error] = await this.fetchPages({ pageSize, pageIndex });

    if (this.isExpiredFetching(currentTime)) return;

    if (error) {
      this.updateStatus({ error, isFetching: false });
      this.action.onError?.({ error, arg });
    } else {
      this.flush(data, { start: pageIndex });
      this.updateData(data);
      this.updateStatus({ error: null, isFetching: false });
      this.action.onSuccess?.({ data, arg });
    }
  };

  /**
   * Sync the data in `data` from the `start` index to the model,
   * and notify the listeners which are listening this accessor.
   */
  private flush = (data: RD[], { start }: { start: number }) => {
    const pageSize = data.length;
    data.forEach((data, pageIndex) => {
      if (pageIndex < start) return;
      this.updateModel(draft => {
        this.action.syncModel(draft, {
          data,
          arg: this.arg,
          pageIndex,
          pageSize,
        });
      });
    });
  };

  private pageSize = () => {
    return this.data.length;
  };
}
