import type { ModelSubscribe } from './ModelAccessor';
import { ModelAccessor } from './ModelAccessor';
import type { NormalAction } from './types';
import type { Draft } from 'immer';

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

  private internalFetch = async (remainRetryCount: number): Promise<[Data | null, E | null]> => {
    const result: [Data | null, E | null] = [null, null];
    const arg = this.arg;
    try {
      const data = await this.action.fetchData(arg);
      result[0] = data;
    } catch (error) {
      if (remainRetryCount > 0) {
        const retryResult = await this.internalFetch(remainRetryCount - 1);
        return retryResult;
      }
      result[1] = error as E;
    }

    return result;
  };

  revalidate = async () => {
    if (this.status.isFetching) return;
    this.updateStatus({ isFetching: true });
    const arg = this.arg;
    const [data, error] = await this.internalFetch(this.retryCount);
    if (data) {
      this.updateModel(draft => {
        this.action.syncModel(draft, { data, arg });
      });
      this.updateStatus({ error: null });
      this.action.onSuccess?.({ data, arg });
    } else {
      this.updateStatus({ error });
      this.action.onError?.({ error: error!, arg });
    }
    this.notifyDataListeners();
    this.updateStatus({ isFetching: false });
  };

  /**
   * @internal
   * @returns
   */
  registerRevalidateOnFocus = () => {
    return super.registerRevalidateOnFocus(this.revalidate);
  };

  /**
   * @internal
   * @returns
   */
  registerRevalidateOnReconnect = () => {
    return super.registerRevalidateOnReconnect(this.revalidate);
  };
}
