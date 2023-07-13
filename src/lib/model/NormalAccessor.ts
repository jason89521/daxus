import { getCurrentTime } from '../utils/index.js';
import { Accessor } from './Accessor.js';
import type { NormalAction, NormalConstructorArgs } from './types.js';
import type { Draft } from 'immer';

/**
 * [`data`, `error`]
 */
type FetchResult<D, E> = [D | null, E | null];

export class NormalAccessor<S, Arg = any, Data = any, E = unknown> extends Accessor<
  S,
  Data,
  E,
  Arg
> {
  private action: NormalAction<S, Arg, Data, E>;
  private updateState: (cb: (draft: Draft<S>) => void) => void;

  /**
   * @internal
   */
  constructor({
    getState,
    modelSubscribe,
    action,
    arg,
    updateState,
    notifyModel,
    onMount,
    onUnmount,
    prefix,
    isLazy,
  }: NormalConstructorArgs<S, Arg, Data, E>) {
    super({ getState, modelSubscribe, onMount, onUnmount, arg, prefix, notifyModel, isLazy });
    this.action = action;
    this.arg = arg;
    this.updateState = updateState;
  }

  /**
   * {@inheritDoc Accessor.revalidate}
   */
  revalidate = () => {
    const startAt = getCurrentTime();

    if (!this.canFetch({ startAt })) {
      return this.fetchPromise;
    }

    const fetchPromise = (async () => {
      try {
        const arg = this.arg;
        const [data, error] = await this.internalFetch(this.getRetryCount());

        // expired means that there is an another valid `revalidation` is fetching.
        if (this.isExpiredFetching(startAt)) {
          return this.fetchPromise;
        }
        this.updateStartAt(startAt);

        if (data) {
          this.updateState(draft => {
            this.action.syncState(draft, { data, arg, startAt });
          });
          this.updateStatus({ error: null });
          this.action.onSuccess?.({ data, arg });
        } else {
          this.updateStatus({ error });
          this.action.onError?.({ error: error!, arg });
        }
        this.notifyDataListeners();
        this.onFetchingFinish();
        if (error) return [error] as const;
        if (data) return [null, data] as const;
        throw new Error('It is impossible that data and error are both null');
      } catch (error) {
        // This error happens when any fetching is aborted.
        // We don't need to handle this.
        return this.fetchPromise;
      }
    })();
    this.onFetchingStart({ fetchPromise, startAt });
    return this.fetchPromise;
  };

  /**
   * Throw an error when the error retry is aborted.
   * @param remainRetryCount
   * @returns
   */
  private internalFetch = async (remainRetryCount: number): Promise<FetchResult<Data, E>> => {
    const result: FetchResult<Data, E> = [null, null];
    const arg = this.arg;
    try {
      const data = await this.action.fetchData(arg);
      result[0] = data;
    } catch (error) {
      if (remainRetryCount <= 0) {
        result[1] = error as E;
        return result;
      }
      // Call reject in order to abort this retry and the revalidate.
      const retryResult = await new Promise<FetchResult<Data, E>>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
          this.internalFetch(remainRetryCount - 1)
            .then(resolve)
            .catch(reject);
        }, this.getRetryInterval());

        this.setRetryTimeoutMeta({ timeoutId, reject });
      });
      return retryResult;
    }

    return result;
  };
}
