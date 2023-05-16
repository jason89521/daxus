import { ModelAccessor } from './ModelAccessor';
import type { NormalAction } from './types';
import type { Draft } from 'immer';

export type Cache<Data> = {
  data?: Data;
  isFetching: boolean;
};

export class NormalModelAccessor<Model, Arg, Data> extends ModelAccessor<Data | null> {
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
    getModel: () => Model
  ) {
    super({ isFetching: false, data: null });
    this.action = action;
    this.arg = arg;
    this.updateModel = updateModel;
    this.getModel = getModel;
  }

  private internalFetch = async (retryCount: number) => {
    const result: { data: Data | null; error: unknown } = { data: null, error: null };
    for (let i = 0; i < retryCount; i++) {
      try {
        const data = await this.action.fetchData(this.arg);
        result.data = data;
        return result;
      } catch (error) {
        result.error = error;
      }
    }

    return result;
  };

  private revalidate = () => {
    this.fetch();
  };

  fetch = async ({ retryCount = 3 }: { retryCount?: number } = {}) => {
    if (this.cache.isFetching) return;
    this.updateCache({ isFetching: true });

    const { data, error } = await this.internalFetch(retryCount);
    if (data) {
      this.updateModel(async draft => {
        this.action.syncModel(draft, { data, arg: this.arg });
      });
      this.action.onSuccess?.({ data, arg: this.arg });
      this.updateCache({ data, isFetching: false });
    } else {
      this.action.onError?.({ error, arg: this.arg });
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

  getCache = () => {
    return this.cache;
  };
}
