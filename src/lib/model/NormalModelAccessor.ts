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

  revalidate = async () => {
    if (this.status.isFetching) return;
    this.updateStatus({ isFetching: true });
    const arg = this.arg;
    try {
      const data = await this.action.fetchData(arg);
      this.updateModel(draft => {
        this.action.syncModel(draft, { data, arg });
      });
      this.action.onSuccess?.({ data, arg });
      this.notifyDataListeners();
    } catch (error) {
      this.action.onError?.({ error, arg });
      // retry
      this.revalidate();
    } finally {
      this.updateStatus({ isFetching: false });
    }
  };

  /**
   * @internal
   * @returns
   */
  registerRevalidateOnFocus = () => {
    this.revalidateOnFocusCount += 1;
    if (this.revalidateOnFocusCount === 1) {
      window.addEventListener('focus', this.revalidate);
    }

    return () => {
      this.revalidateOnFocusCount -= 1;
      if (this.revalidateOnFocusCount === 0) {
        window.removeEventListener('focus', this.revalidate);
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
      window.addEventListener('online', this.revalidate);
    }

    return () => {
      this.revalidateOnReconnectCount -= 1;
      if (this.revalidateOnReconnectCount === 0) {
        window.removeEventListener('online', this.revalidate);
      }
    };
  };
}
