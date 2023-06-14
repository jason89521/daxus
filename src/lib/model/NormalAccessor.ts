import { getCurrentTime } from '../utils';
import type { ModelSubscribe } from './Accessor';
import { Accessor } from './Accessor';
import type { NormalAction } from './types';
import type { Draft } from 'immer';

/**
 * [`data`, `error`]
 */
type FetchResult<D, E> = [D | null, E | null];

export class NormalAccessor<Model, Arg = any, Data = any, E = unknown> extends Accessor<Model, E> {
  private action: NormalAction<Model, Arg, Data, E>;
  private arg: Arg;
  private updateModel: (cb: (model: Draft<Model>) => void) => void;
  private notifyModel: () => void;

  constructor(
    arg: Arg,
    action: NormalAction<Model, Arg, Data>,
    updateModel: (cb: (model: Draft<Model>) => void) => void,
    getModel: () => Model,
    modelSubscribe: ModelSubscribe,
    notifyModel: () => void
  ) {
    super(getModel, modelSubscribe);
    this.action = action;
    this.arg = arg;
    this.updateModel = updateModel;
    this.notifyModel = notifyModel;
  }

  revalidate = async () => {
    const currentTime = getCurrentTime();

    if (!this.canFetch({ currentTime })) return;

    this.updateStartAt(currentTime);
    this.updateStatus({ isFetching: true });
    this.onFetchingStart();
    const arg = this.arg;
    try {
      const [data, error] = await this.internalFetch(this.getRetryCount());

      if (this.isExpiredFetching(currentTime)) return;
      this.updateStartAt(currentTime);

      if (data) {
        this.updateModel(draft => {
          this.action.syncModel(draft, { data, arg, startAt: currentTime });
        });
        this.updateStatus({ error: null });
        this.action.onSuccess?.({ data, arg });
      } else {
        this.updateStatus({ error });
        this.action.onError?.({ error: error!, arg });
      }
      this.notifyModel();
      this.updateStatus({ isFetching: false });
      this.onFetchingFinish();
    } catch (error) {
      // This error happens when any fetching is aborted.
      // We don't need to handle this.
    }
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
