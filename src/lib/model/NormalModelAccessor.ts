import type { ModelSubscribe } from './ModelAccessor';
import { ModelAccessor } from './ModelAccessor';
import type { NormalAction } from './types';
import type { Draft } from 'immer';

export class NormalModelAccessor<Model, Arg, Data> extends ModelAccessor {
  private action: NormalAction<Model, Arg, Data>;
  private arg: Arg;
  private updateModel: (cb: (model: Draft<Model>) => void) => void;
  private revalidateOnFocusCount = 0;
  private revalidateOnReconnectCount = 0;

  getModel: () => Model;

  constructor(
    arg: Arg,
    action: NormalAction<Model, Arg, Data>,
    updateModel: (cb: (model: Draft<Model>) => void) => void,
    getModel: () => Model,
    modelSubscribe: ModelSubscribe
  ) {
    super(modelSubscribe);
    this.action = action;
    this.arg = arg;
    this.updateModel = updateModel;
    this.getModel = getModel;
  }

  revalidate = async () => {
    if (this.cache.isFetching) return;
    this.updateCache({ isFetching: true });
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
    } finally {
      this.updateCache({ isFetching: false });
    }
  };

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
