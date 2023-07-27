import type { AutoModel, Model } from './Model.js';
import { createModel as origCreateModel, createAutoModel as origCreateAutoModel } from './Model.js';
import { objectKeys } from '../utils/index.js';
import type { NotifyDatabaseContext } from './types.js';

export interface Database {
  createModel<S extends object>(ctx: { name: string; initialState: S }): Model<S>;
  createAutoModel(ctx: { name: string }): AutoModel;
  subscribe(serverStateKey: object, cb: (ctx: NotifyDatabaseContext) => void): void;
  getModel(modelName: string): Model<any> | AutoModel | undefined;
}

export function createDatabase(): Database {
  const modelRecord: Record<string, Model<any> | AutoModel | undefined> = {};
  const serverStateListenerRecord = new WeakMap<object, (ctx: NotifyDatabaseContext) => void>();

  function assertDuplicateName(name: string) {
    if (objectKeys(modelRecord).includes(name)) {
      throw new Error(`The model name: ${name} has already existed!`);
    }
  }

  function subscribe(serverStateKey: object, cb: (ctx: NotifyDatabaseContext) => void) {
    serverStateListenerRecord.set(serverStateKey, cb);
  }

  function onServerStateChange(ctx: NotifyDatabaseContext) {
    const cb = serverStateListenerRecord.get(ctx.serverStateKey);
    if (!cb) return;
    cb(ctx);
  }

  function createModel<S extends object>({
    name,
    initialState,
  }: {
    name: string;
    initialState: S;
  }) {
    assertDuplicateName(name);
    const model = origCreateModel(initialState, ({ serverStateKey, ...ctx }) => {
      if (serverStateKey) onServerStateChange({ ...ctx, modelName: name, serverStateKey });
    });
    modelRecord[name] = model;
    return model;
  }

  function createAutoModel({ name }: { name: string }) {
    assertDuplicateName(name);
    const model = origCreateAutoModel(({ serverStateKey, ...ctx }) => {
      if (serverStateKey) onServerStateChange({ ...ctx, modelName: name, serverStateKey });
    });
    modelRecord[name] = model;
    return model;
  }

  return {
    createModel,
    createAutoModel,
    subscribe,
    getModel(modelName) {
      return modelRecord[modelName];
    },
  };
}
