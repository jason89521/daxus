import { getCurrentTime } from '../utils/index.js';
import type { ModelSubscribe } from './Accessor.js';
import { Accessor } from './Accessor.js';
import type { InfiniteAction } from './types.js';
import type { Draft } from 'immer';

type Task = 'validate' | 'next' | 'idle';

export class InfiniteAccessor<S, Arg = any, Data = any, E = unknown> extends Accessor<
  S,
  Data[],
  E
> {
  private action: InfiniteAction<S, Arg, Data, E>;
  private arg: Arg;
  private updateState: (cb: (draft: Draft<S>) => void) => void;
  private data: Data[] = [];
  /**
   * This property is used to reject ant ongoing fetching.
   * It may be invoked when there is a revalidation executing,
   * but the user call the fetching next.
   */
  private rejectFetching: (() => void) | null = null;
  private currentTask: Task = 'idle';
  private notifyModel: () => void;

  /**
   * @internal
   */
  constructor(
    arg: Arg,
    action: InfiniteAction<S, Arg, Data, E>,
    updateState: (cb: (draft: Draft<S>) => void) => void,
    getState: (serverStateKey?: object) => S,
    modelSubscribe: ModelSubscribe,
    notifyModel: () => void
  ) {
    super(getState, modelSubscribe);
    this.arg = arg;
    this.action = action;
    this.updateState = updateState;
    this.notifyModel = notifyModel;
  }

  /**
   * {@inheritDoc Accessor.revalidate}
   */
  revalidate = () => {
    const pageSize = this.pageSize() || 1;
    return this.fetch({ pageSize, pageIndex: 0, task: 'validate' });
  };

  /**
   * Fetch the next page.
   * @returns The all pages if it is not interrupted by the other revalidation, otherwise returns `null`.
   */
  fetchNext = () => {
    const pageIndex = this.pageSize();
    const pageSize = pageIndex + 1;
    return this.fetch({ pageSize, pageIndex, task: 'next' });
  };

  private updateData = (data: Data[]) => {
    this.data = data;
    this.notifyModel();
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
    const result: [Data[], E | null] = [dataArray, null];
    let previousData: Data | null = dataArray[pageIndex - 1] ?? null;
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

  private fetch = ({
    pageIndex = this.pageSize(),
    pageSize,
    task,
  }: {
    pageIndex?: number;
    pageSize: number;
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
        const arg = this.arg;
        const [data, error] = await this.fetchPages({ pageSize, pageIndex });

        // expired means that there is an another `fetch` is fetching.
        if (this.isExpiredFetching(startAt)) return this.fetchPromise;

        if (error) {
          this.updateStatus({ error });
          this.action.onError?.({ error, arg });
        } else {
          this.flush(data, { start: pageIndex });
          this.updateData(data);
          this.updateStatus({ error: null });
          this.action.onSuccess?.({ data, arg });
        }
        this.currentTask = 'idle';
        this.onFetchingFinish();
        return error ? ([null, error] as const) : ([data, null] as const);
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

  private pageSize = () => {
    return this.data.length;
  };
}
