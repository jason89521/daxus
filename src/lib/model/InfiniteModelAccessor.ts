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
    const result: [RD | null, E | null] = [null, null];
    const arg = this.arg;
    try {
      const data = await this.action.fetchData(arg, { previousData, pageIndex });
      result[0] = data;
    } catch (error) {
      if (remainRetryCount > 0) {
        return await this.fetchPage({
          previousData,
          pageIndex,
          remainRetryCount: remainRetryCount - 1,
        });
      }
      result[1] = error as E;
    }

    return result;
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
        remainRetryCount: this.retryCount,
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
    if (!this.canFetch({ currentTime })) return;

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

  pageSize = () => {
    return this.data.length;
  };

  revalidate = async () => {
    const pageSize = this.pageSize() || 1;
    this.fetch({ pageSize, pageIndex: 0 });
  };

  fetchNext = async () => {
    const pageIndex = this.pageSize();
    const pageSize = pageIndex + 1;
    this.fetch({ pageSize, pageIndex });
  };

  registerRevalidateOnFocus = () => {
    return super.registerRevalidateOnFocus(this.revalidate);
  };

  registerRevalidateOnReconnect = () => {
    return super.registerRevalidateOnReconnect(this.revalidate);
  };
}
