import type { AutoModel, Model } from './Model.js';
import { createModel as origCreateModel, createAutoModel as origCreateAutoModel } from './Model.js';
import { isUndefined, objectKeys } from '../utils/index.js';
import type { NotifyDatabaseContext } from './types.js';

export interface Database {
  createModel<S extends object>(ctx: { name: string; initialState: S }): Model<S>;
  createAutoModel(ctx: { name: string }): AutoModel;
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
      const model = origCreateModel(initialState, ({ data, creatorName, ...ctx }) => {
        if (!data || isUndefined(creatorName)) return;
        onServerStateChange({ ...ctx, modelName: name, data, creatorName });
      });
      modelRecord[name] = model;
      return model;
    },
    createAutoModel({ name }) {
      assertDuplicateName(name);
      const model = origCreateAutoModel(({ data, creatorName, ...ctx }) => {
        if (!data || isUndefined(creatorName)) return;
        onServerStateChange({ ...ctx, modelName: name, data, creatorName });
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
