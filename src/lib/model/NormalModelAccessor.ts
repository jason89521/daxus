import type { ModelSubscribe } from './ModelAccessor';
import { ModelAccessor } from './ModelAccessor';
import type { NormalAction } from './types';
import type { Draft } from 'immer';

export class NormalModelAccessor<Model, Arg, Data> extends ModelAccessor<Model> {
  private action: NormalAction<Model, Arg, Data>;
  private arg: Arg;
  private updateModel: (cb: (model: Draft<Model>) => void) => void;
  private revalidateOnFocusCount = 0;
  private revalidateOnReconnectCount = 0;

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

  private internalFetch = async (remainRetryCount: number): Promise<[Data | null, unknown]> => {
    const result: [Data | null, unknown] = [null, null];
    const arg = this.arg;
    try {
      const data = await this.action.fetchData(arg);
      result[0] = data;
    } catch (error) {
      if (remainRetryCount > 0) {
        const retryResult = await this.internalFetch(remainRetryCount - 1);
        return retryResult;
      }
      result[1] = error;
    }

    return result;
  };

  fetch = async () => {
    if (this.status.isFetching) return;
    this.updateStatus({ isFetching: true });
    const arg = this.arg;
    const [data, error] = await this.internalFetch(this.retryCount);
    if (data) {
      this.updateModel(draft => {
        this.action.syncModel(draft, { data, arg });
      });
      this.action.onSuccess?.({ data, arg });
    } else {
      this.action.onError?.({ error, arg });
    }
    this.notifyDataListeners();
    this.updateStatus({ isFetching: false });
  };

  /**
   * @internal
   * @returns
   */
  registerRevalidateOnFocus = () => {
    this.revalidateOnFocusCount += 1;
    if (this.revalidateOnFocusCount === 1) {
      window.addEventListener('focus', this.fetch);
    }

    return () => {
      this.revalidateOnFocusCount -= 1;
      if (this.revalidateOnFocusCount === 0) {
        window.removeEventListener('focus', this.fetch);
      }
    };
  };

  /**
   * @internal
   * @returns
   */
  registerRevalidateOnReconnect = () => {
    this.revalidateOnReconnectCount += 1;
    if (this.revalidateOnFocusCount === 1) {
      window.addEventListener('online', this.fetch);
    }

    return () => {
      this.revalidateOnReconnectCount -= 1;
      if (this.revalidateOnReconnectCount === 0) {
        window.removeEventListener('online', this.fetch);
      }
    };
  };
}
