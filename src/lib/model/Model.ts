import { createDraft, finishDraft } from 'immer';
import type { Draft } from 'immer';
import type { InfiniteAction, NormalAction } from './types.js';
import { NormalAccessor } from './NormalAccessor.js';
import { InfiniteAccessor } from './InfiniteAccessor.js';
import { isServer, stableHash } from '../utils/index.js';

interface BaseAccessorCreator {
  invalidate(): void;
}
export interface NormalAccessorCreator<S, Arg, Data, E> extends BaseAccessorCreator {
  (arg: Arg): NormalAccessor<S, Arg, Data, E>;
}
export interface InfiniteAccessorCreator<S, Arg, Data, E> extends BaseAccessorCreator {
  (arg: Arg): InfiniteAccessor<S, Arg, Data, E>;
}

export interface Model<S extends object> {
  mutate(fn: (draft: Draft<S>) => void, serverStateKey?: object): void;
  defineInfiniteAccessor<Arg, Data, E = any>(
    action: InfiniteAction<S, Arg, Data, E>
  ): InfiniteAccessorCreator<S, Arg, Data, E>;
  defineNormalAccessor<Arg, Data, E = any>(
    action: NormalAction<S, Arg, Data, E>
  ): NormalAccessorCreator<S, Arg, Data, E>;
  getState(serverStateKey?: object): S;
  /**
   * Invalidate all accessor generated from this model.
   */
  invalidate(): void;
  /**
   * @internal
   */
  subscribe(listener: () => void): () => void;
}

export function createModel<S extends object>(initialState: S): Model<S> {
  type Accessor<Arg = any, Data = any> =
    | NormalAccessor<S, Arg, Data, any>
    | InfiniteAccessor<S, Arg, Data, any>;

  let prefixCounter = 0;
  const serverStateRecord = new WeakMap<object, S>();
  let clientState = { ...initialState };
  const listeners: (() => void)[] = [];
  const accessorRecord = {} as Record<string, Accessor | undefined>;

  function updateState(fn: (draft: Draft<S>) => void, serverStateKey?: object) {
    if (isServer() && serverStateKey) {
      const serverState = serverStateRecord.get(serverStateKey) ?? { ...initialState };
      const draft = createDraft(serverState);
      fn(draft);
      serverStateRecord.set(serverStateKey, finishDraft(draft) as S);
      return;
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

  function defineNormalAccessor<Arg, Data, E = unknown>(
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
      invalidate: () => {
        Object.entries(accessorRecord).forEach(([key, accessor]) => {
          if (key.startsWith(`${prefix}/`)) {
            accessor?.invalidate();
          }
        });
      },
    });
  }

  function defineInfiniteAccessor<Arg, Data, E = unknown>(
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
      invalidate: () => {
        Object.entries(accessorRecord).forEach(([key, accessor]) => {
          if (key.startsWith(`${prefix}/`)) {
            accessor?.invalidate();
          }
        });
      },
    });
  }

  function invalidate() {
    Object.values(accessorRecord).forEach(accessor => {
      accessor?.invalidate();
    });
  }

  return { mutate, defineInfiniteAccessor, defineNormalAccessor, getState, invalidate, subscribe };
}
