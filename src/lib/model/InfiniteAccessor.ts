import { getCurrentTime } from '../utils';
import type { ModelSubscribe } from './Accessor';
import { Accessor } from './Accessor';
import type { InfiniteAction } from './types';
import type { Draft } from 'immer';

type Task = 'validate' | 'next' | 'idle';

export class InfiniteAccessor<M, Arg = any, RD = any, E = unknown> extends Accessor<M, E> {
  private action: InfiniteAction<M, Arg, RD>;
  private arg: Arg;
  private updateModel: (cb: (draft: Draft<M>) => void) => void;
  private data: RD[] = [];
  /**
   * This property is used to reject ant ongoing fetching.
   * It may be invoked when there is a revalidation executing,
   * but the user call the fetching next.
   */
  private rejectFetching: (() => void) | null = null;
  private currentTask: Task = 'idle';

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
    this.fetch({ pageSize, pageIndex: 0, task: 'validate' });
  };

  /**
   * @internal
   * @returns
   */
  fetchNext = async () => {
    const pageIndex = this.pageSize();
    const pageSize = pageIndex + 1;
    this.fetch({ pageSize, pageIndex, task: 'next' });
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
            })
              .then(resolve)
              .catch(reject);
          }, this.getRetryInterval());
          this.setRetryTimeoutMeta({ timeoutId, reject });
        });
      this.rejectFetching = reject;
    });

    return promise;
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
    task,
  }: {
    pageIndex?: number;
    pageSize: number;
    task: Task;
  }) => {
    const currentTime = getCurrentTime();
    if (!this.canFetch({ currentTime })) {
      // If the next task is to fetch the next page, and the current task is validate,
      // then abort the current task and start to fetch next page.
      if (!(this.currentTask === 'validate' && task === 'next')) {
        return;
      }
    }

    this.currentTask = task;
    this.rejectFetching?.();
    this.updateStartAt(currentTime);
    this.updateStatus({ isFetching: true });
    this.onFetchingStart();
    const arg = this.arg;
    try {
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
      this.currentTask = 'idle';
      this.onFetchingFinish();
    } catch (error) {
      // This error happens when any fetching is aborted.
      // We don't need to handle this.
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
