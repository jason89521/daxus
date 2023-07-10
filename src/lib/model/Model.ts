import { createDraft, finishDraft } from 'immer';
import type { Draft } from 'immer';
import type {
  InfiniteAction,
  NormalAction,
  InfiniteConstructorArgs,
  NormalConstructorArgs,
} from './types.js';
import { NormalAccessor } from './NormalAccessor.js';
import { InfiniteAccessor } from './InfiniteAccessor.js';
import { getKey, isServer, stableHash } from '../utils/index.js';
import type { Accessor } from './Accessor.js';

const CLEAR_ACCESSOR_CACHE_TIME = 60 * 1000;

interface BaseAccessorCreator {
  invalidate(): void;
}

export type LazyState = Record<string, unknown>;

export type LazyNormalAction<Arg, Data, E> = Omit<
  NormalAction<LazyState, Arg, Data, E>,
  'syncState'
>;

export type LazyInfiniteAction<Arg, Data, E> = Omit<
  InfiniteAction<LazyState, Arg, Data, E>,
  'syncState'
>;

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

export interface LazyModel
  extends Omit<Model<LazyState>, 'mutate' | 'defineNormalAccessor' | 'defineInfiniteAccessor'> {
  mutate<Data, E = unknown>(
    accessor: Accessor<LazyState, Data, E>,
    fn: (prevData: Data | undefined) => Data,
    serverStateKey?: object
  ): void;
  defineNormalAccessor<Arg, Data, E = unknown>(
    action: LazyNormalAction<Arg, Data, E>
  ): NormalAccessorCreator<LazyState, Arg, Data, E>;
  defineInfiniteAccessor<Arg, Data, E = unknown>(
    action: LazyInfiniteAction<Arg, Data, E>
  ): InfiniteAccessorCreator<LazyState, Arg, Data, E>;
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
    let timeoutId: number | undefined;
    const main = (arg: Arg) => {
      const hashArg = stableHash(arg);
      const key = `${prefix}/${hashArg}`;

      const clearAccessorCache = () => {
        const accessor = accessorRecord[key];
        if (!accessor) return;
        // Don't delete the accessor if it is mounted.
        if (accessor.isMounted()) return;
        delete accessorRecord[key];
      };

      const onMount = () => {
        window.clearTimeout(timeoutId);
      };

      const onUnmount = () => {
        timeoutId = window.setTimeout(clearAccessorCache, CLEAR_ACCESSOR_CACHE_TIME);
      };

      const constructorArgs: NormalConstructorArgs<S, Arg, Data, E> = {
        arg,
        action,
        updateState,
        getState,
        modelSubscribe: subscribe,
        notifyModel: notifyListeners,
        onMount,
        onUnmount,
        prefix,
      };

      if (isServer()) {
        // We don't need to cache the accessor in server side.
        return new NormalAccessor(constructorArgs);
      }

      // Remove the clear cache timeout since the accessor is being used.
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(clearAccessorCache, CLEAR_ACCESSOR_CACHE_TIME);

      const accessor = accessorRecord[key];
      if (accessor) {
        return accessor as NormalAccessor<S, Arg, Data, E>;
      }

      const newAccessor = new NormalAccessor(constructorArgs);
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
    let timeoutId: number | undefined;
    const main = (arg: Arg) => {
      const hashArg = stableHash(arg);
      const key = `${prefix}/${hashArg}`;

      const clearAccessorCache = () => {
        const accessor = accessorRecord[key];
        if (!accessor) return;
        // Don't delete the accessor if it is mounted.
        if (accessor.isMounted()) return;
        delete accessorRecord[key];
      };

      const onMount = () => {
        window.clearTimeout(timeoutId);
      };

      const onUnmount = () => {
        timeoutId = window.setTimeout(clearAccessorCache, CLEAR_ACCESSOR_CACHE_TIME);
      };

      const constructorArgs: InfiniteConstructorArgs<S, Arg, Data, E> = {
        arg,
        action,
        getState,
        modelSubscribe: subscribe,
        notifyModel: notifyListeners,
        updateState,
        onMount,
        onUnmount,
        prefix,
      };

      if (isServer()) {
        // We don't need to cache the accessor in server side.
        return new InfiniteAccessor(constructorArgs);
      }

      // Remove the clear cache timeout since the accessor is being used.
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(clearAccessorCache, CLEAR_ACCESSOR_CACHE_TIME);
      const accessor = accessorRecord[key];
      if (accessor) {
        return accessor as InfiniteAccessor<S, Arg, Data, E>;
      }
      const newAccessor = new InfiniteAccessor(constructorArgs);
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

export function createLazyModel(): LazyModel {
  const model = createModel<LazyState>({});
  let prefixCounter = 0;

  function defineNormalAccessor<Arg, Data, E = unknown>(action: LazyNormalAction<Arg, Data, E>) {
    const prefix = prefixCounter++;
    return model.defineNormalAccessor({
      ...action,
      syncState(draft, { data, arg }) {
        const key = getKey(prefix, arg);
        draft[key] = data;
      },
      prefix,
    });
  }

  function defineInfiniteAccessor<Arg, Data, E = unknown>(
    action: LazyInfiniteAction<Arg, Data, E>
  ) {
    const prefix = prefixCounter++;
    return model.defineInfiniteAccessor({
      ...action,
      prefix,
      syncState(draft, { pageIndex, data, arg }) {
        const key = getKey(prefix, arg);
        if (pageIndex === 0) {
          draft[key] = [data];
          return;
        }

        const pages = draft[key] as Data[];
        pages[pageIndex] = data;
      },
    });
  }

  function mutate<Data, E = unknown>(
    accessor: Accessor<LazyState, Data, E>,
    fn: (prevData: Data) => Data,
    serverStateKey?: object
  ) {
    const key = accessor.getKey();
    const prevData = model.getState(serverStateKey)[key] as Data;
    const newData = fn(prevData);
    model.mutate(draft => {
      draft[key] = newData;
    });
  }

  return {
    ...model,
    defineNormalAccessor,
    defineInfiniteAccessor,
    mutate,
  };
}
