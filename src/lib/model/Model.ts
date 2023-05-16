import { createDraft, finishDraft } from 'immer';
import type { Draft } from 'immer';
import type { ArgFromAction, RemoteDataFromAction } from './types';
import { NormalModelAccessor } from './NormalModelAccessor';
import type { Action } from './types';
import { InfiniteModelAccessor } from './InfiniteModelAccessor';
import { stableHash } from '../utils';

type AccessorGettersFromActionIdentifier<M, As extends Record<string, Action<M>>> = {
  [Key in keyof As]: (
    arg: ArgFromAction<As[Key]>
  ) => As[Key]['type'] extends 'infinite'
    ? InfiniteModelAccessor<M, ArgFromAction<As[Key]>, RemoteDataFromAction<As[Key]>>
    : NormalModelAccessor<M, ArgFromAction<As[Key]>, RemoteDataFromAction<As[Key]>>;
};

export class Model<M extends object, As extends Record<string, Action<M>>> {
  private model: M;
  private accessors = {} as Record<
    string,
    | NormalModelAccessor<M, unknown, unknown>
    | InfiniteModelAccessor<M, unknown, unknown>
    | undefined
  >;

  accessorGetters = {} as AccessorGettersFromActionIdentifier<M, As>;

  constructor(initialModel: M, identifiers: As) {
    this.model = initialModel;

    Object.entries(identifiers).forEach(([actionName, action]) => {
      const getModelAccessor = (arg: ArgFromAction<typeof action>) => {
        const hashedArg = stableHash(arg);
        const key = `${actionName}/${hashedArg}`;
        const accessor = this.accessors[key];
        if (accessor) return accessor;
        const newAccessor = (() => {
          if (action.type === 'infinite') {
            return new InfiniteModelAccessor(arg, action, this.updateModel, this.getModel);
          }

          return new NormalModelAccessor(arg, action, this.updateModel, this.getModel);
        })();
        this.accessors[key] = newAccessor;

        return newAccessor;
      };

      this.accessorGetters[actionName as keyof As] = getModelAccessor as any;
    });
  }

  private updateModel = (fn: (modelDraft: Draft<M>) => void) => {
    const draft = createDraft(this.model);
    fn(draft);
    this.model = finishDraft(draft) as M;
  };

  private getModel = () => {
    return this.model;
  };
}
