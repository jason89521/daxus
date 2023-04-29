import { createDraft, finishDraft } from 'immer';
import type { Draft } from 'immer';
import type { ArgFromAction, RemoteDataFromAction } from './types';
import { ModelAccessor } from './ModelAccessor';
import type { ActionIdentifier } from './actionIdentifier';
import { InfiniteModelAccessor } from './InfiniteModelAccessor';

type AccessorGettersFromActionIdentifier<M, AIs extends Record<string, ActionIdentifier<M>>> = {
  [Key in keyof AIs]: (
    arg: ArgFromAction<AIs[Key]['action']>
  ) => AIs[Key]['type'] extends 'infinite'
    ? InfiniteModelAccessor<
        M,
        ArgFromAction<AIs[Key]['action']>,
        RemoteDataFromAction<AIs[Key]['action']>
      >
    : ModelAccessor<M, ArgFromAction<AIs[Key]['action']>, RemoteDataFromAction<AIs[Key]['action']>>;
};

export class Model<M extends object, AIs extends Record<string, ActionIdentifier<M>>> {
  private model: M;
  private accessors = {} as Record<
    string,
    ModelAccessor<M, unknown, unknown> | InfiniteModelAccessor<M, unknown, unknown> | undefined
  >;

  accessorGetters = {} as AccessorGettersFromActionIdentifier<M, AIs>;

  constructor(initialModel: M, identifiers: AIs) {
    this.model = initialModel;

    Object.entries(identifiers).forEach(([actionName, identifier]) => {
      const getModelAccessor = (arg: ArgFromAction<typeof identifier.action>) => {
        const serializedArg = typeof arg === 'undefined' ? '' : JSON.stringify(arg);
        const key = `${actionName}/${serializedArg}`;
        const accessor = this.accessors[key];
        if (accessor) return accessor;
        const newAccessor = (() => {
          if (identifier.type === 'infinite') {
            return new InfiniteModelAccessor(
              arg,
              identifier.action,
              this.updateModel,
              this.getModel
            );
          }

          return new ModelAccessor(arg, identifier.action, this.updateModel, this.getModel);
        })();
        this.accessors[key] = newAccessor;

        return newAccessor;
      };

      this.accessorGetters[actionName as keyof AIs] = getModelAccessor as any;
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
