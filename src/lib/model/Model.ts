import { createDraft, finishDraft } from 'immer';
import type { Draft } from 'immer';
import type { InfiniteAction, NormalAction } from './types';
import { NormalAccessor } from './NormalAccessor';
import { InfiniteAccessor } from './InfiniteAccessor';
import { stableHash } from '../utils';

type Accessor<M> = NormalAccessor<M> | InfiniteAccessor<M>;

export function createModel<S extends object>(initialState: S) {
  let prefixCounter = 0;
  let state = initialState;
  const listeners: (() => void)[] = [];
  const accessors = {} as Record<string, Accessor<S> | undefined>;

  function updateState(fn: (draft: Draft<S>) => void) {
    const draft = createDraft(state);
    fn(draft);
    state = finishDraft(draft) as S;
  }

  function getState() {
    return state;
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

  function mutate(fn: (draft: Draft<S>) => void) {
    updateState(fn);
    notifyListeners();
  }

  function defineAccessor<Arg, Data>(
    type: 'normal',
    action: NormalAction<S, Arg, Data>
  ): (arg: Arg) => NormalAccessor<S, Arg, Data>;
  function defineAccessor<Arg, Data>(
    type: 'infinite',
    action: InfiniteAction<S, Arg, Data>
  ): (arg: Arg) => InfiniteAccessor<S, Arg, Data>;
  function defineAccessor<Arg, Data>(
    type: 'normal' | 'infinite',
    action: NormalAction<S, Arg, Data> | InfiniteAction<S, Arg, Data>
  ) {
    const prefix = prefixCounter++;

    return (arg: Arg) => {
      const hashArg = stableHash(arg);
      const key = `${prefix}/${hashArg}`;
      const accessor = accessors[key];
      if (accessor) return accessor;
      const newAccessor = (() => {
        const constructorArgs = [
          arg,
          action as any,
          updateState,
          getState,
          subscribe,
          notifyListeners,
        ] as const;
        if (type === 'infinite') {
          return new InfiniteAccessor(...constructorArgs);
        }

        return new NormalAccessor(...constructorArgs);
      })();
      accessors[key] = newAccessor;

      return newAccessor;
    };
  }

  return { mutate, defineAccessor, getState };
}
