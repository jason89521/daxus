import { getCurrentTime } from '../utils/index.js';
import type { RevalidateContext } from './BaseAccessor.js';
import { BaseAccessor } from './BaseAccessor.js';
import type { Action, ConstructorArgs, UpdateModelState } from './types.js';

/**
 * [`data`, `error`]
 */
type FetchResult<D, E> = [D | null, E | null];

export class Accessor<S, Arg = any, Data = any, E = unknown> extends BaseAccessor<S, Arg, Data, E> {
  protected action: Action<S, Arg, Data, E>;
  private updateState: UpdateModelState<S>;

  /**
   * @internal
   */
  constructor({
    getState,
    subscribeModel,
    action,
    arg,
    updateState,
    notifyModel,
    onMount,
    onUnmount,
    isAuto,
    setStaleTime,
    getIsStale,
  }: ConstructorArgs<S, Arg, Data, E>) {
    super({
      getState,
      subscribeModel,
      onMount,
      onUnmount,
      arg,
      creatorName: action.name,
      notifyModel,
      isAuto,
      setStaleTime,
      getIsStale,
    });
    this.action = action;
    this.arg = arg;
    this.updateState = updateState;
  }

  /**
   * {@inheritDoc BaseAccessor.revalidate}
   */
  revalidate = ({ serverStateKey }: RevalidateContext = {}) => {
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
          this.updateState(
            draft => {
              this.action.syncState(draft, { data, arg });
            },
            { serverStateKey, data, arg, creatorName: this.creatorName }
          );
        }
        return this.onFetchingFinish({ error, data });
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
      const data = await this.action.fetchData(arg, { getState: () => this.getState() });
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
