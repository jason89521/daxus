import { createDraft, finishDraft } from 'immer';
import type { Draft } from 'immer';
import type { FetchObject } from './types';
import { ModelAccessor } from './ModelAccessor';

type GetActionsFromFetchObjects<M extends object, Fs extends Record<string, FetchObject<M>>> = {
  [Key in keyof Fs]: (arg: Parameters<Fs[Key]['fetchData']>[0]) => ModelAccessor<M, Fs[Key]>;
};

export class Model<S extends object, Fs extends Record<string, FetchObject<S>>> {
  private model: S;
  private accessors = {} as Record<string, ModelAccessor<S, FetchObject<S>> | undefined>;

  actions = {} as GetActionsFromFetchObjects<S, Fs>;

  constructor(initialModel: S, fetchObjects: Fs) {
    this.model = initialModel;

    Object.entries(fetchObjects).forEach(([actionName, fetchObject]) => {
      const getCacheData = (arg: Parameters<typeof fetchObject['fetchData']>[0]) => {
        const serializedArg = typeof arg === 'undefined' ? '' : JSON.stringify(arg);
        const key = `${actionName}/${serializedArg}`;
        const accessor = this.accessors[key];
        if (accessor) return accessor;
        const newAccessor = new ModelAccessor(arg, fetchObject, this.updateModel, this.getModel);
        this.accessors[key] = newAccessor;

        return newAccessor;
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
