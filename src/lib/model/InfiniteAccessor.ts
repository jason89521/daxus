import { getCurrentTime } from '../utils/index.js';
import { Accessor } from './Accessor.js';
import type { InfiniteAction, InfiniteConstructorArgs } from './types.js';
import type { Draft } from 'immer';

type Task = 'validate' | 'next' | 'idle';

export class InfiniteAccessor<S, Arg = any, Data = any, E = unknown> extends Accessor<
  S,
  Data[],
  E,
  Arg
> {
  protected action: InfiniteAction<S, Arg, Data, E>;
  private updateState: (cb: (draft: Draft<S>) => void) => void;
  private data: Data[] = [];
  /**
   * This property is used to reject ant ongoing fetching.
   * It may be invoked when there is a revalidation executing,
   * but the user call the fetching next.
   */
  private rejectFetching: (() => void) | null = null;
  private currentTask: Task = 'idle';
  private initialPageNum: number;

  /**
   * @internal
   */
  constructor({
    getState,
    modelSubscribe,
    arg,
    action,
    updateState,
    notifyModel,
    onMount,
    onUnmount,
    prefix,
    initialPageNum,
    isLazy,
  }: InfiniteConstructorArgs<S, Arg, Data, E>) {
    super({ getState, modelSubscribe, onMount, onUnmount, arg, prefix, notifyModel, isLazy });
    this.action = action;
    this.updateState = updateState;
    this.initialPageNum = initialPageNum;
  }

  /**
   * @internal
   */
  getPageNum = () => {
    return this.data.length;
  };

  /**
   * {@inheritDoc Accessor.revalidate}
   */
  revalidate = () => {
    const pageNum = this.getPageNum() || this.initialPageNum;
    return this.fetch({ pageNum, pageIndex: 0, task: 'validate' });
  };

  /**
   * Fetch the next page.
   * @returns The all pages if it is not interrupted by the other revalidation, otherwise returns `null`.
   */
  fetchNext = () => {
    const pageIndex = this.getPageNum();
    const pageNum = pageIndex + 1;
    return this.fetch({ pageNum, pageIndex, task: 'next' });
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
    previousData: Data | null;
    pageIndex: number;
    remainRetryCount: number;
  }): Promise<[Data | null, E | null]> => {
    const arg = this.arg;
    const promise = new Promise<[Data | null, E | null]>((resolve, reject) => {
      this.action
        .fetchData(arg, { previousData, pageIndex, getState: () => this.getState() })
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
  private fetchPages = async ({ pageNum, pageIndex }: { pageNum: number; pageIndex: number }) => {
    const dataArray = [...this.data];
    const result: [Data[], E | null] = [dataArray, null];
    let previousData: Data | null = dataArray[pageIndex - 1] ?? null;
    for (; pageIndex < pageNum; pageIndex++) {
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

  private fetch = ({
    pageIndex,
    pageNum,
    task,
  }: {
    pageIndex: number;
    pageNum: number;
    task: Task;
  }) => {
    const startAt = getCurrentTime();
    if (!this.canFetch({ startAt })) {
      // If the next task is to fetch the next page, and the current task is validate,
      // then abort the current task and start to fetch next page.
      if (!(this.currentTask === 'validate' && task === 'next')) {
        return this.fetchPromise;
      }
    }

    this.currentTask = task;
    this.rejectFetching?.();
    const fetchPromise = (async () => {
      try {
        const [data, error] = await this.fetchPages({ pageNum, pageIndex });

        // expired means that there is an another `fetch` is fetching.
        if (this.isExpiredFetching(startAt)) return this.fetchPromise;

        if (!error) {
          this.flush(data, { start: pageIndex });
          this.data = data;
        }
        this.currentTask = 'idle';
        return this.onFetchingFinish({ error, data });
      } catch (error) {
        // This error happens when any fetching is aborted.
        // We don't need to handle this.
        return this.fetchPromise;
      }
    })();
    this.onFetchingStart({ fetchPromise, startAt });
    return fetchPromise;
  };

  /**
   * Sync the data in `data` from the `start` index to the state,
   * and notify the listeners which are listening this accessor.
   */
  private flush = (data: Data[], { start }: { start: number }) => {
    const pageSize = data.length;
    data.forEach((data, pageIndex) => {
      if (pageIndex < start) return;
      this.updateState(draft => {
        this.action.syncState(draft, {
          data,
          arg: this.arg,
          pageIndex,
          pageSize,
        });
      });
    });
  };
}
