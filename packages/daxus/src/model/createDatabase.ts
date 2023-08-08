import type {
  AccessorCreator,
  InfiniteAccessorCreator,
  Model as OrigModel,
} from './createModel.js';
import { createModel as origCreateModel } from './createModel.js';
import { isUndefined, objectKeys } from '../utils/index.js';
import type {
  NotifyDatabaseContext,
  Action as OrigAction,
  InfiniteAction as OrigInfiniteAction,
} from './types.js';
import type { AutoState, AutoModel as OrigAutoModel } from './createAutoModel.js';
import { createAutoModel as origCreateAutoModel } from './createAutoModel.js';

type Action<S, Arg, Data, E> = OrigAction<S, Arg, Data, E> & { name: string };

type InfiniteAction<S, Arg, Data, E> = OrigInfiniteAction<S, Arg, Data, E> & { name: string };

type Model<S extends object> = Omit<OrigModel<S>, 'defineAccessor' | 'defineInfiniteAccessor'> & {
  defineAccessor<Data, Arg = void, E = any>(
    action: Action<S, Arg, Data, E>
  ): AccessorCreator<S, Arg, Data, E>;
  defineInfiniteAccessor<Data, Arg = void, E = any>(
    action: InfiniteAction<S, Arg, Data, E>
  ): InfiniteAccessorCreator<S, Arg, Data, E>;
};

type AutoModel = Omit<OrigAutoModel, 'defineAccessor' | 'defineInfiniteAccessor'> & {
  defineAccessor<Data, Arg = void, E = any>(
    action: Action<AutoState, Arg, Data, E>
  ): AccessorCreator<AutoState, Arg, Data, E>;
  defineInfiniteAccessor<Data, Arg = void, E = any>(
    action: InfiniteAction<AutoState, Arg, Data, E>
  ): InfiniteAccessorCreator<AutoState, Arg, Data, E>;
};

export interface Database {
  createModel<S extends object>(options: { name: string; initialState: S }): Model<S>;
  createAutoModel(options: { name: string }): AutoModel;
  /**
   * We use server state key to register the callback.
   * One server state key can only register one callback.
   *
   * This method is not useful for general use case, feel free to ignore this method.
   */
  subscribe(serverStateKey: object, cb: (ctx: NotifyDatabaseContext) => void): void;
  /**
   * This method is not useful for general use case, feel free to ignore this method.
   */
  getModel(modelName: string): Model<any> | AutoModel | undefined;
}

export function createDatabase(): Database {
  const modelRecord: Record<string, Model<any> | AutoModel> = {};
  const serverStateListenerRecord = new WeakMap<object, (ctx: NotifyDatabaseContext) => void>();

  function assertDuplicateName(name: string) {
    if (objectKeys(modelRecord).includes(name)) {
      throw new Error(`The model name: ${name} has already existed!`);
    }
  }

  function onServerStateChange(ctx: NotifyDatabaseContext) {
    const cb = serverStateListenerRecord.get(ctx.serverStateKey);
    if (!cb) return;
    cb(ctx);
  }

  return {
    createModel({ name, initialState }) {
      assertDuplicateName(name);
      const model = origCreateModel({
        initialState,
        onServerStateChange({ data, creatorName, ...ctx }) {
          if (!data || isUndefined(creatorName)) return;
          onServerStateChange({ ...ctx, modelName: name, data, creatorName });
        },
      });
      modelRecord[name] = model;
      return model;
    },
    createAutoModel({ name }) {
      assertDuplicateName(name);
      const model = origCreateAutoModel({
        onServerStateChange({ data, creatorName, ...ctx }) {
          if (!data || isUndefined(creatorName)) return;
          onServerStateChange({ ...ctx, modelName: name, data, creatorName });
        },
      });
      modelRecord[name] = model;
      return model;
    },
    subscribe(serverStateKey, cb) {
      serverStateListenerRecord.set(serverStateKey, cb);
    },
    getModel(modelName) {
      return modelRecord[modelName];
    },
  };
}
