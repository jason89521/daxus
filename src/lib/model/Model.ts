import { createDraft, finishDraft } from 'immer';
import type { Draft } from 'immer';
import type { Action, ArgFromAction, RemoteDataFromAction } from './types';
import { ModelAccessor } from './ModelAccessor';

type GetAccessorGettersFromActions<M extends object, As extends Record<string, Action<M>>> = {
  [Key in keyof As]: (
    arg: ArgFromAction<As[Key]>
  ) => ModelAccessor<M, ArgFromAction<As[Key]>, RemoteDataFromAction<As[Key]>>;
};

export class Model<M extends object, Fs extends Record<string, Action<M>>> {
  private model: M;
  private accessors = {} as Record<string, ModelAccessor<M, unknown, unknown> | undefined>;

  accessorGetters = {} as GetAccessorGettersFromActions<M, Fs>;

  constructor(initialModel: M, actions: Fs) {
    this.model = initialModel;

    Object.entries(actions).forEach(([actionName, action]) => {
      const getModelAccessor = (arg: ArgFromAction<typeof action>) => {
        const serializedArg = typeof arg === 'undefined' ? '' : JSON.stringify(arg);
        const key = `${actionName}/${serializedArg}`;
        const accessor = this.accessors[key];
        if (accessor) return accessor;
        const newAccessor = new ModelAccessor(arg, action, this.updateModel, this.getModel);
        this.accessors[key] = newAccessor;

        return newAccessor;
      };

      this.accessorGetters[actionName as keyof Fs] = getModelAccessor as any;
    });
  }

  private updateModel = async (fn: (modelDraft: Draft<M>) => Promise<unknown>) => {
    const draft = createDraft(this.model);
    await fn(draft);
    this.model = finishDraft(draft) as M;
  };

  private getModel = () => {
    return this.model;
  };
}
