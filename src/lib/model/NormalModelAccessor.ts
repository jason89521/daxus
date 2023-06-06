import { getCurrentTime } from '../utils';
import type { ModelSubscribe } from './ModelAccessor';
import { ModelAccessor } from './ModelAccessor';
import type { NormalAction } from './types';
import type { Draft } from 'immer';

/**
 * [`data`, `error`, `the time where the request start at`]
 */
type FetchResult<D, E> = [D | null, E | null, number];

export class NormalModelAccessor<Model, Arg = any, Data = any, E = unknown> extends ModelAccessor<
  Model,
  E
> {
  private action: NormalAction<Model, Arg, Data, E>;
  private arg: Arg;
  private updateModel: (cb: (model: Draft<Model>) => void) => void;

  constructor(
    arg: Arg,
    action: NormalAction<Model, Arg, Data>,
    updateModel: (cb: (model: Draft<Model>) => void) => void,
    getModel: () => Model,
    modelSubscribe: ModelSubscribe
  ) {
    super(getModel, modelSubscribe);
    this.action = action;
    this.arg = arg;
    this.updateModel = updateModel;
  }

  /**
   * @internal
   * @returns
   */
  revalidate = async () => {
    const currentTime = getCurrentTime();

    if (!this.canFetch({ currentTime })) return;

    this.abortRetry();
    this.updateStartAt(currentTime);

    this.updateStatus({ isFetching: true });
    this.onFetchingStart();
    const arg = this.arg;
    const [data, error, startAt] = await this.internalFetch(this.getRetryCount());

    if (this.isExpiredFetching(startAt)) return;
    this.updateStartAt(startAt);

    if (data) {
      this.updateModel(draft => {
        this.action.syncModel(draft, { data, arg, startAt });
      });
      this.updateStatus({ error: null });
      this.action.onSuccess?.({ data, arg });
    } else {
      this.updateStatus({ error });
      this.action.onError?.({ error: error!, arg });
    }
    this.notifyDataListeners();
    this.updateStatus({ isFetching: false });
    this.onFetchingFinish();
  };

  /**
   * Throw an error when the error retry is aborted.
   * @param remainRetryCount
   * @returns
   */
  private internalFetch = async (remainRetryCount: number): Promise<FetchResult<Data, E>> => {
    const result: FetchResult<Data, E> = [null, null, getCurrentTime()];
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
        const timeoutId = window.setTimeout(async () => {
          const r = await this.internalFetch(remainRetryCount - 1);
          resolve(r);
        }, this.getRetryInterval());

        this.setRetryTimeoutMeta({ timeoutId, reject });
      });
      return retryResult;
    }

    return result;
  };
}
