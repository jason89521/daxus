import { createDraft, finishDraft } from 'immer';
import type { Draft } from 'immer';
import type { InfiniteAction, NormalAction } from './types';
import { NormalAccessor } from './NormalAccessor';
import { InfiniteAccessor } from './InfiniteAccessor';
import { isServer, stableHash } from '../utils';

interface BaseAccessorCreator {
  setIsStale(isStale: boolean): void;
}
export interface NormalAccessorCreator<S, Arg, Data> extends BaseAccessorCreator {
  (arg: Arg): NormalAccessor<S, Arg, Data>;
}
export interface InfiniteAccessorCreator<S, Arg, Data> extends BaseAccessorCreator {
  (arg: Arg): InfiniteAccessor<S, Arg, Data>;
}

export function createModel<S extends object>(initialState: S) {
  type Accessor<Arg = any, Data = any> =
    | NormalAccessor<S, Arg, Data>
    | InfiniteAccessor<S, Arg, Data>;

  let prefixCounter = 0;
  const serverStateRecord = new WeakMap<object, S>();
  let clientState = { ...initialState };
  const listeners: (() => void)[] = [];
  const accessorRecord = {} as Record<string, Accessor | undefined>;

  function updateState(fn: (draft: Draft<S>) => void, serverStateKey?: object) {
    if (isServer() && serverStateKey) {
      const serverState = serverStateRecord.get(serverStateKey) ?? { ...initialState };
      serverStateRecord.set(serverStateKey, serverState);
      const draft = createDraft(serverState);
      fn(draft);
      serverStateRecord.set(serverStateKey, finishDraft(draft) as S);
    }

    const draft = createDraft(clientState);
    fn(draft);
    clientState = finishDraft(draft) as S;
  }

  function getState(serverStateKey?: object) {
    if (isServer() && serverStateKey) {
      const serverState = serverStateRecord.get(serverStateKey) ?? { ...initialState };
      serverStateRecord.set(serverStateKey, serverState);
      return serverState;
    }

    return clientState;
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

  function mutate(fn: (draft: Draft<S>) => void, serverStateKey?: object) {
    updateState(fn, serverStateKey);
    notifyListeners();
  }

  function defineAccessor<Arg, Data>(
    type: 'normal',
    action: NormalAction<S, Arg, Data>
  ): NormalAccessorCreator<S, Arg, Data>;
  function defineAccessor<Arg, Data>(
    type: 'infinite',
    action: InfiniteAction<S, Arg, Data>
  ): InfiniteAccessorCreator<S, Arg, Data>;
  function defineAccessor<Arg, Data>(
    type: 'normal' | 'infinite',
    action: NormalAction<S, Arg, Data> | InfiniteAction<S, Arg, Data>
  ) {
    const prefix = prefixCounter++;
    const creatorFunc = (arg: Arg) => {
      const hashArg = stableHash(arg);
      const key = `${prefix}/${hashArg}`;
      const accessor = accessorRecord[key];
      if (accessor) {
        return accessor;
      }
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
      accessorRecord[key] = newAccessor;

      return newAccessor;
    };

    return Object.assign(creatorFunc, {
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

  return { mutate, defineAccessor, getState, setIsStale };
}
