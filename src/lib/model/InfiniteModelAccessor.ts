import type { ModelSubscribe } from './ModelAccessor';
import { ModelAccessor } from './ModelAccessor';
import type { InfiniteAction } from './types';
import type { Draft } from 'immer';

export class InfiniteModelAccessor<M, Arg = any, RD = any> extends ModelAccessor<M> {
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
  }): Promise<[RD | null, unknown]> => {
    const result: [RD | null, unknown] = [null, null];
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
      result[1] = error;
    }

    return result;
  };

  /**
   * Fetch the pages from `pageIndex` to `pageSize` (exclusive).
   */
  private fetchPages = async ({
    pageSize,
    pageIndex = this.pageSize(),
  }: {
    pageSize: number;
    pageIndex?: number;
  }) => {
    const dataArray = [...this.data];
    let previousData: RD | null = dataArray[pageIndex - 1] ?? null;
    for (; pageIndex < pageSize; pageIndex++) {
      const [data, error] = await this.fetchPage({
        previousData,
        pageIndex,
        remainRetryCount: this.retryCount,
      });
      if (error) {
        throw error;
      }
      if (!data) {
        break;
      }
      previousData = data;
      dataArray[pageIndex] = previousData;
    }

    return dataArray.slice(0, pageIndex);
  };

  private fetch = async ({
    pageIndex = this.pageSize(),
    pageSize,
  }: {
    pageIndex?: number;
    pageSize: number;
  }) => {
    if (this.status.isFetching) return;
    this.updateStatus({ isFetching: true });
    const arg = this.arg;
    try {
      const data = await this.fetchPages({ pageSize, pageIndex });
      this.flush(data, { start: pageIndex });
      this.updateData(data);
      this.action.onSuccess?.({ data, arg });
    } catch (error) {
      this.action.onError?.({ error, arg });
    } finally {
      this.updateStatus({ isFetching: false });
    }
  };

  /**
   * Sync the data in `data` from the `start` index to the model,
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
