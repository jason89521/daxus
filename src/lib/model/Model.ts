import { createDraft, finishDraft } from 'immer';
import type { Draft } from 'immer';
import type { InfiniteAction, NormalAction } from './types';
import { NormalModelAccessor } from './NormalModelAccessor';
import { InfiniteModelAccessor } from './InfiniteModelAccessor';
import { stableHash } from '../utils';
import type { ModelAccessor } from './ModelAccessor';

export function createModel<M extends object>(initialModel: M) {
  let prefixCounter = 0;
  let model = initialModel;
  const listeners: (() => void)[] = [];
  const accessors = {} as Record<string, ModelAccessor<M> | undefined>;

  function updateModel(fn: (draft: Draft<M>) => void) {
    const draft = createDraft(model);
    fn(draft);
    model = finishDraft(draft) as M;
  }

  function getModel() {
    return model;
  }

  function subscribe(listener: () => void) {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      listeners.splice(index, 1);
    };
  }

  function notifyListeners() {
    listeners.forEach(l => l());
  }

  function mutate(fn: (draft: Draft<M>) => void) {
    updateModel(fn);
    notifyListeners();
  }

  function defineNormalAction<Arg, Data>(
    action: NormalAction<M, Arg, Data>
  ): (arg: Arg) => NormalModelAccessor<M, Arg, Data> {
    const prefix = prefixCounter++;

    return (arg: Arg) => {
      const hashArg = stableHash(arg);
      const key = `${prefix}/${hashArg}`;
      const accessor = accessors[key];
      if (accessor) return accessor as any;
      const newAccessor = new NormalModelAccessor(arg, action, updateModel, getModel, subscribe);
      accessors[key] = newAccessor;

      return newAccessor;
    };
  }

  function defineInfiniteAction<Arg, Data>(
    action: InfiniteAction<M, Arg, Data>
  ): (arg: Arg) => InfiniteModelAccessor<M, Arg, Data> {
    const prefix = prefixCounter++;

    return arg => {
      const hashArg = stableHash(arg);
      const key = `${prefix}/${hashArg}`;
      const accessor = accessors[key];
      if (accessor) return accessor as any;
      const newAccessor = new InfiniteModelAccessor(arg, action, updateModel, getModel, subscribe);
      accessors[key] = newAccessor;

      return newAccessor;
    };
  }

  return { defineNormalAction, defineInfiniteAction, mutate };
}
