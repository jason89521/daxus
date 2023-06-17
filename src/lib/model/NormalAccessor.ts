import { getCurrentTime } from '../utils';
import type { ModelSubscribe } from './Accessor';
import { Accessor } from './Accessor';
import type { NormalAction } from './types';
import type { Draft } from 'immer';

/**
 * [`data`, `error`]
 */
type FetchResult<D, E> = [D | null, E | null];

export class NormalAccessor<S, Arg = any, Data = any, E = unknown> extends Accessor<S, Data, E> {
  private action: NormalAction<S, Arg, Data, E>;
  private arg: Arg;
  private updateState: (cb: (draft: Draft<S>) => void) => void;
  private notifyModel: () => void;

  constructor(
    arg: Arg,
    action: NormalAction<S, Arg, Data>,
    updateState: (cb: (draft: Draft<S>) => void) => void,
    getState: () => S,
    modelSubscribe: ModelSubscribe,
    notifyModel: () => void
  ) {
    super(getState, modelSubscribe);
    this.action = action;
    this.arg = arg;
    this.updateState = updateState;
    this.notifyModel = notifyModel;
  }

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
        if (this.isExpiredFetching(startAt)) return null;
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
        this.notifyModel();
        this.updateStatus({ isFetching: false });
        this.onFetchingSuccess();
        return data;
      } catch (error) {
        // This error happens when any fetching is aborted.
        // We don't need to handle this.
        return null;
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
