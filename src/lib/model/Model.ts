import { createDraft, finishDraft } from 'immer';
import type { Draft } from 'immer';
import type { InfiniteAction, NormalAction } from './types';
import { NormalModelAccessor } from './NormalModelAccessor';
import { InfiniteModelAccessor } from './InfiniteModelAccessor';
import { stableHash } from '../utils';

type Accessor<M> = NormalModelAccessor<M> | InfiniteModelAccessor<M>;

export function createModel<M extends object>(initialModel: M) {
  let prefixCounter = 0;
  let model = initialModel;
  const listeners: (() => void)[] = [];
  const accessors = {} as Record<string, Accessor<M> | undefined>;

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

  function defineAction<Arg, Data>(
    type: 'normal',
    action: NormalAction<M, Arg, Data>
  ): (arg: Arg) => NormalModelAccessor<M, Arg, Data>;
  function defineAction<Arg, Data>(
    type: 'infinite',
    action: InfiniteAction<M, Arg, Data>
  ): (arg: Arg) => InfiniteModelAccessor<M, Arg, Data>;
  function defineAction<Arg, Data>(
    type: 'normal' | 'infinite',
    action: NormalAction<M, Arg, Data> | InfiniteAction<M, Arg, Data>
  ) {
    const prefix = prefixCounter++;

    return (arg: Arg) => {
      const hashArg = stableHash(arg);
      const key = `${prefix}/${hashArg}`;
      const accessor = accessors[key];
      if (accessor) return accessor;
      const newAccessor = (() => {
        const constructorArgs = [arg, action as any, updateModel, getModel, subscribe] as const;
        if (type === 'infinite') {
          return new InfiniteModelAccessor(...constructorArgs);
        }

        return new NormalModelAccessor(...constructorArgs);
      })();
      accessors[key] = newAccessor;

      return newAccessor;
    };
  }

  return { mutate, defineAction, getModel };
}
