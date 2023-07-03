import { createDraft, finishDraft } from 'immer';
import type { Draft } from 'immer';
import type { InfiniteAction, NormalAction } from './types';
import { NormalAccessor } from './NormalAccessor';
import { InfiniteAccessor } from './InfiniteAccessor';
import { stableHash } from '../utils';

interface BaseAccessorCreator {
  setIsStale(isStale: boolean): void;
}
export interface NormalAccessorCreator<S, Arg, Data, E> extends BaseAccessorCreator {
  (arg: Arg): NormalAccessor<S, Arg, Data, E>;
}
export interface InfiniteAccessorCreator<S, Arg, Data, E> extends BaseAccessorCreator {
  (arg: Arg): InfiniteAccessor<S, Arg, Data, E>;
}

export function createModel<S extends object>(initialState: S) {
  type Accessor<Arg = any, Data = any> =
    | NormalAccessor<S, Arg, Data, any>
    | InfiniteAccessor<S, Arg, Data, any>;

  let prefixCounter = 0;
  let state = initialState;
  const listeners: (() => void)[] = [];
  const accessorRecord = {} as Record<string, Accessor | undefined>;

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

  function defineNormalAccessor<Arg, Data, E = any>(
    action: NormalAction<S, Arg, Data, E>
  ): NormalAccessorCreator<S, Arg, Data, E> {
    const prefix = prefixCounter++;
    const main = (arg: Arg) => {
      const hashArg = stableHash(arg);
      const key = `${prefix}/${hashArg}`;
      const accessor = accessorRecord[key];
      if (accessor) {
        return accessor as NormalAccessor<S, Arg, Data, E>;
      }

      const newAccessor = new NormalAccessor(
        arg,
        action,
        updateState,
        getState,
        subscribe,
        notifyListeners
      );
      accessorRecord[key] = newAccessor;
      return newAccessor;
    };

    return Object.assign(main, {
      setIsStale: (isStale: boolean) => {
        Object.entries(accessorRecord).forEach(([key, accessor]) => {
          if (key.startsWith(`${prefix}`)) {
            accessor?.setIsStale(isStale);
          }
        });
      },
    });
  }

  function defineInfiniteAccessor<Arg, Data, E = any>(
    action: InfiniteAction<S, Arg, Data, E>
  ): InfiniteAccessorCreator<S, Arg, Data, E> {
    const prefix = prefixCounter++;
    const main = (arg: Arg) => {
      const hashArg = stableHash(arg);
      const key = `${prefix}/${hashArg}`;
      const accessor = accessorRecord[key];
      if (accessor) {
        return accessor as InfiniteAccessor<S, Arg, Data, E>;
      }
      const newAccessor = new InfiniteAccessor(
        arg,
        action,
        updateState,
        getState,
        subscribe,
        notifyListeners
      );
      accessorRecord[key] = newAccessor;
      return newAccessor;
    };

    return Object.assign(main, {
      setIsStale: (isStale: boolean) => {
        Object.entries(accessorRecord).forEach(([key, accessor]) => {
          if (key.startsWith(`${prefix}`)) {
            accessor?.setIsStale(isStale);
          }
        });
      },
    });
  }

  function setIsStale(isStale: boolean) {
    Object.values(accessorRecord).forEach(accessor => {
      accessor?.setIsStale(isStale);
    });
  }

  return { mutate, defineInfiniteAccessor, defineNormalAccessor, getState, setIsStale };
}
