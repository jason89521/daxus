import type { AutoModel, Model } from './Model.js';
import { createModel as origCreateModel, createAutoModel as origCreateAutoModel } from './Model.js';
import { objectKeys } from '../utils/index.js';
import type { NotifyDatabaseContext } from './types.js';

export interface Database {
  createModel<S extends object>(ctx: { name: string; initialState: S }): Model<S>;
  createAutoModel(ctx: { name: string }): AutoModel;
  subscribe(cb: (ctx: NotifyDatabaseContext) => void): void;
  getModel(modelName: string): Model<any> | AutoModel | undefined;
}

export function createDatabase(): Database {
  const modelRecord: Record<string, Model<any> | AutoModel | undefined> = {};
  const listeners: ((ctx: NotifyDatabaseContext) => void)[] = [];

  function assertDuplicateName(name: string) {
    if (objectKeys(modelRecord).includes(name)) {
      throw new Error(`The model name: ${name} has already existed!`);
    }
  }

  function subscribe(cb: (ctx: NotifyDatabaseContext) => void) {
    listeners.push(cb);
    return () => {
      const index = listeners.indexOf(cb);
      listeners.splice(index, 1);
    };
  }

  function onStateChange(ctx: NotifyDatabaseContext) {
    listeners.forEach(l => l(ctx));
  }

  function createModel<S extends object>({
    name,
    initialState,
  }: {
    name: string;
    initialState: S;
  }) {
    assertDuplicateName(name);
    const model = origCreateModel(initialState, ctx => {
      onStateChange({ ...ctx, modelName: name });
    });
    modelRecord[name] = model;
    return model;
  }

  function createAutoModel({ name }: { name: string }) {
    assertDuplicateName(name);
    const model = origCreateAutoModel(ctx => {
      onStateChange({ ...ctx, modelName: name });
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
