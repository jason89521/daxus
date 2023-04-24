import { createDraft, finishDraft } from 'immer';
import type { Draft } from 'immer';

export type FetchObject<Model, Arg = any, Data = any> = {
  fetchData: (arg: Arg) => Promise<Data>;
  syncModel: (model: Draft<Model>, payload: { remoteData: Data; arg: Arg }) => void;
  validateModel?: (model: Draft<Model>, payload: { remoteData: Data; arg: Arg }) => void;
};

type GetCacheDataFromFetchObjects<M extends object, Fs extends Record<string, FetchObject<M>>> = {
  [Key in keyof Fs]: (arg: Parameters<Fs[Key]['fetchData']>[0]) => CacheData<M, Fs[Key]>;
};

type ArgFromFetchObject<FO extends FetchObject<any>> = Parameters<FO['fetchData']>[1];

export class CacheData<M, FO extends FetchObject<M>> {
  private listeners: (() => void)[] = [];
  private status: { isFetching: boolean; hasFetched: boolean; isValidating: boolean };
  private fetchObject: FO;
  private arg: ArgFromFetchObject<FO>;
  private updateModel: (cb: (model: Draft<M>) => Promise<void>) => Promise<void>;
  getLatestModel: () => M;

  constructor(
    arg: ArgFromFetchObject<FO>,
    fetchObject: FO,
    updateModel: (cb: (model: Draft<M>) => Promise<void>) => Promise<void>,
    getLatestModel: () => M
  ) {
    this.fetchObject = fetchObject;
    this.arg = arg;
    this.updateModel = updateModel;
    this.getLatestModel = getLatestModel;
    this.status = {
      isFetching: false,
      hasFetched: false,
      isValidating: false,
    };
  }

  private mutateStatus = (newInfo: Partial<typeof this.status>) => {
    this.status = { ...this.status, ...newInfo };
    this.notifyListeners();
  };

  private notifyListeners = () => {
    this.listeners.forEach(l => l());
  };

  subscribe = (listener: () => void) => {
    this.listeners.push(listener);
    return () => {
      this.listeners.splice(this.listeners.indexOf(listener), 1);
    };
  };

  getStatusSnapshot = () => {
    return this.status;
  };

  fetchData = async () => {
    if (this.status.isFetching) return;
    this.mutateStatus({ isFetching: true });
    const data = await this.fetchObject.fetchData(this.arg);
    this.updateModel(async draft => {
      this.fetchObject.syncModel(draft, { remoteData: data, arg: this.arg });
    });
    this.mutateStatus({
      isFetching: false,
      hasFetched: true,
    });
  };

  mutate = async (mutateFn: (state: Draft<M>) => Promise<void>) => {
    await this.updateModel(async draft => {
      await mutateFn(draft);
    });
    this.notifyListeners();
  };

  validate = async () => {
    if (typeof this.fetchObject.validateModel === 'undefined') return;
    if (this.status.isFetching || this.status.isValidating) return;
    this.mutateStatus({ isValidating: true });
    const data = await this.fetchObject.fetchData(this.arg);
    this.updateModel(async draft => {
      this.fetchObject.validateModel?.(draft, { remoteData: data, arg: this.arg });
    });
    this.mutateStatus({ isValidating: false });
  };
}

export class Model<S extends object, Fs extends Record<string, FetchObject<S>>> {
  private model: S;
  private cache = {} as Record<string, CacheData<S, FetchObject<S>> | undefined>;

  actions = {} as GetCacheDataFromFetchObjects<S, Fs>;

  constructor(initialModel: S, fetchObjects: Fs) {
    this.model = initialModel;

    Object.entries(fetchObjects).forEach(([actionName, fetchObject]) => {
      const getCacheData = (arg: Parameters<typeof fetchObject['fetchData']>[0]) => {
        const serializedArg = typeof arg === 'undefined' ? '' : JSON.stringify(arg);
        const key = `${actionName}/${serializedArg}`;
        const cacheData = this.cache[key];
        if (cacheData) return cacheData;
        const newCacheData = new CacheData(arg, fetchObject, this.updateModel, this.getModel);
        this.cache[key] = newCacheData;

        return newCacheData;
      };

      this.actions[actionName as keyof Fs] = getCacheData as any;
    });
  }

  private updateModel = async (fn: (modelDraft: Draft<S>) => Promise<unknown>) => {
    const draft = createDraft(this.model);
    await fn(draft);
    this.model = finishDraft(draft) as S;
  };

  private getModel = () => {
    return this.model;
  };
}
