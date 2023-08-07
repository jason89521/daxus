import { createDraft, finishDraft } from 'immer';
import type { Draft } from 'immer';
import type {
  InfiniteAction,
  Action,
  InfiniteConstructorArgs,
  ConstructorArgs,
  UpdateModelState,
  UpdateModelStateContext,
} from './types.js';
import { Accessor } from './Accessor.js';
import { InfiniteAccessor } from './InfiniteAccessor.js';
import { getKey, isServer, objectKeys } from '../utils/index.js';
import type { BaseAccessor } from './BaseAccessor.js';

const CLEAR_ACCESSOR_CACHE_TIME = 60 * 1000;

interface BaseAccessorCreator<S> {
  mutate: (fn: (draft: Draft<S>) => void) => void;
  invalidate(): void;
}

export type AutoState = Record<string, unknown>;

export type AutoAction<Arg, Data, E> = Omit<Action<AutoState, Arg, Data, E>, 'syncState'>;

export type AutoInfiniteAction<Arg, Data, E> = Omit<
  InfiniteAction<AutoState, Arg, Data, E>,
  'syncState'
>;

export interface AccessorCreator<S, Arg = any, Data = any, E = any> extends BaseAccessorCreator<S> {
  (arg: Arg): Accessor<S, Arg, Data, E>;
  syncState: Action<S, Arg, Data, E>['syncState'];
}
export interface InfiniteAccessorCreator<S, Arg = any, Data = any, E = any>
  extends BaseAccessorCreator<S> {
  (arg: Arg): InfiniteAccessor<S, Arg, Data, E>;
  syncState: InfiniteAction<S, Arg, Data, E>['syncState'];
}

export interface Model<S extends object> {
  getCreator(creatorName: string): InfiniteAccessorCreator<S> | AccessorCreator<S> | undefined;
  mutate(fn: (draft: Draft<S>) => void, serverStateKey?: object): void;
  defineInfiniteAccessor<Data, Arg = void, E = any>(
    action: InfiniteAction<S, Arg, Data, E>
  ): InfiniteAccessorCreator<S, Arg, Data, E>;
  defineAccessor<Data, Arg = void, E = any>(
    action: Action<S, Arg, Data, E>
  ): AccessorCreator<S, Arg, Data, E>;
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

export interface AutoModel
  extends Pick<Model<AutoState>, 'invalidate' | 'subscribe' | 'getCreator'> {
  mutate<Arg, Data, E = unknown>(
    accessor: BaseAccessor<AutoState, Arg, Data, E>,
    fn: (prevData: Data | undefined) => Data,
    serverStateKey?: object
  ): void;
  defineAccessor<Data, Arg = void, E = unknown>(
    action: AutoAction<Arg, Data, E>
  ): AccessorCreator<AutoState, Arg, Data, E>;
  defineInfiniteAccessor<Data, Arg = void, E = unknown>(
    action: AutoInfiniteAction<Arg, Data, E>
  ): InfiniteAccessorCreator<AutoState, Arg, Data, E>;
  getState<Arg, Data, E = unknown>(
    accessor: BaseAccessor<AutoState, Arg, Data, E>,
    serverStateKey?: object
  ): Data | undefined;
}

interface ServerStateChangeContext extends Omit<UpdateModelStateContext, 'serverStateKey'> {
  serverStateKey: object;
}

export function createModel<S extends object>(
  initialState: S,
  onServerStateChange: (ctx: ServerStateChangeContext) => void
): Model<S> {
  const serverStateRecord = new WeakMap<object, S>();
  let clientState = { ...initialState };
  const listeners: (() => void)[] = [];
  const accessorRecord = {} as Record<
    string,
    Accessor<S, any, any, any> | InfiniteAccessor<S, any, any, any>
  >;
  const creatorRecord = {} as Record<
    string,
    AccessorCreator<S, any, any, any> | InfiniteAccessorCreator<S, any, any, any>
  >;

  // Since accessors may be deleted from cache, we need to save the stale time in the model.
  const staleTimeoutIdRecord = {} as Record<string, number>;
  const isStaleRecord = {} as Record<string, boolean>;

  /**
   * instead of recording the whole data, we only record the pages number to save the memory usage
   */
  const infiniteAccessorPageNumRecord = {} as Record<string, number | undefined>;

  function assertDuplicateName(name: string) {
    if (objectKeys(creatorRecord).includes(name)) {
      throw new Error(`The creator name: ${name} has already existed!`);
    }
  }

  function compositeSetStale(key: string) {
    return function setStale(staleTime: number) {
      const timeoutId = staleTimeoutIdRecord[key];
      clearTimeout(timeoutId);
      // reset the stale state
      isStaleRecord[key] = false;
      if (staleTime === 0) {
        isStaleRecord[key] = true;
      } else if (staleTime > 0 && staleTime !== Number.POSITIVE_INFINITY) {
        staleTimeoutIdRecord[key] = window.setTimeout(() => {
          isStaleRecord[key] = true;
        }, staleTime);
      }
    };
  }

  const updateState: UpdateModelState<S> = (fn, { serverStateKey, ...ctx }) => {
    if (isServer()) {
      if (!serverStateKey) {
        throw new Error(
          'Should provide a server state key if you want to update the state in the server!'
        );
      }

      const serverState = serverStateRecord.get(serverStateKey) ?? { ...initialState };
      const draft = createDraft(serverState);
      fn(draft);
      serverStateRecord.set(serverStateKey, finishDraft(draft) as S);
      // Only invoke this callback in the server.
      onServerStateChange({ ...ctx, serverStateKey });
      return;
    }

    const draft = createDraft(clientState);
    fn(draft);
    clientState = finishDraft(draft) as S;
  };

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
    updateState(fn, { serverStateKey });
    notifyListeners();
  }

  function defineAccessor<Arg, Data, E = unknown>(
    action: Action<S, Arg, Data, E>
  ): AccessorCreator<S, Arg, Data, E> {
    const { name } = action;
    assertDuplicateName(name);
    let timeoutId: number | undefined;
    const main = (arg: Arg) => {
      const key = getKey(name, arg);

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

      const constructorArgs: ConstructorArgs<S, Arg, Data, E> = {
        arg,
        action,
        updateState,
        getState,
        subscribeModel: subscribe,
        notifyModel: notifyListeners,
        onMount,
        onUnmount,
        isAuto: action.isAuto ?? false,
        setStaleTime: compositeSetStale(key),
        getIsStale() {
          return isStaleRecord[key] ?? false;
        },
      };

      if (isServer()) {
        // We don't need to cache the accessor in server side.
        return new Accessor(constructorArgs);
      }

      // Remove the clear cache timeout since the accessor is being used.
      window.clearTimeout(timeoutId);
      // Set a new time to clear the cache
      timeoutId = window.setTimeout(clearAccessorCache, CLEAR_ACCESSOR_CACHE_TIME);

      const accessor = accessorRecord[key];
      if (accessor) {
        return accessor as Accessor<S, Arg, Data, E>;
      }

      const newAccessor = new Accessor(constructorArgs);
      accessorRecord[key] = newAccessor;
      return newAccessor;
    };

    const creator = Object.assign(main, {
      invalidate: () => {
        Object.entries(accessorRecord).forEach(([key, accessor]) => {
          if (key.startsWith(`${name}/`)) {
            accessor.invalidate();
          }
        });
      },
      mutate,
      syncState: action.syncState,
    });

    creatorRecord[name] = creator;

    return creator;
  }

  function defineInfiniteAccessor<Arg, Data, E = unknown>(
    action: InfiniteAction<S, Arg, Data, E>
  ): InfiniteAccessorCreator<S, Arg, Data, E> {
    const { name } = action;
    assertDuplicateName(name);
    let timeoutId: number | undefined;
    const main = (arg: Arg) => {
      const key = getKey(name, arg);

      const clearAccessorCache = () => {
        const accessor = accessorRecord[key] as InfiniteAccessor<S>;
        if (!accessor) return;
        // Don't delete the accessor if it is mounted.
        if (accessor.isMounted()) return;
        infiniteAccessorPageNumRecord[key] = accessor.getPageNum();
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
        subscribeModel: subscribe,
        notifyModel: notifyListeners,
        updateState,
        onMount,
        onUnmount,
        initialPageNum: infiniteAccessorPageNumRecord[key] ?? 1,
        isAuto: action.isAuto ?? false,
        setStaleTime: compositeSetStale(key),
        getIsStale() {
          return isStaleRecord[key] ?? false;
        },
      };

      if (isServer()) {
        // We don't need to cache the accessor in server side.
        return new InfiniteAccessor(constructorArgs);
      }

      // Remove the clear cache timeout since the accessor is being used.
      window.clearTimeout(timeoutId);
      // Set a new time to clear the cache
      timeoutId = window.setTimeout(clearAccessorCache, CLEAR_ACCESSOR_CACHE_TIME);

      const accessor = accessorRecord[key];
      if (accessor) {
        return accessor as InfiniteAccessor<S, Arg, Data, E>;
      }

      const newAccessor = new InfiniteAccessor(constructorArgs);
      accessorRecord[key] = newAccessor;
      return newAccessor;
    };

    const creator = Object.assign(main, {
      invalidate: () => {
        Object.entries(accessorRecord).forEach(([key, accessor]) => {
          if (key.startsWith(`${name}/`)) {
            accessor.invalidate();
          }
        });
      },
      mutate,
      syncState: action.syncState,
    });
    creatorRecord[name] = creator;

    return creator;
  }

  function invalidate() {
    Object.values(accessorRecord).forEach(accessor => {
      accessor.invalidate();
    });
  }

  return {
    mutate,
    defineInfiniteAccessor,
    defineAccessor,
    getState,
    invalidate,
    subscribe,
    getCreator(creatorName) {
      return creatorRecord[creatorName];
    },
  };
}

export function createAutoModel(
  onServerStateChange: (ctx: ServerStateChangeContext) => void
): AutoModel {
  const model = createModel<AutoState>({}, onServerStateChange);

  function defineAccessor<Arg, Data, E = unknown>(action: AutoAction<Arg, Data, E>) {
    const { name } = action;
    return model.defineAccessor({
      ...action,
      isAuto: true,
      syncState(draft, { data, arg }) {
        const key = getKey(name, arg);
        draft[key] = data;
      },
    });
  }

  function defineInfiniteAccessor<Arg, Data, E = unknown>(
    action: AutoInfiniteAction<Arg, Data, E>
  ) {
    const { name } = action;

    return model.defineInfiniteAccessor({
      ...action,
      isAuto: true,
      syncState(draft, { pageIndex, data, arg }) {
        const key = getKey(name, arg);
        if (pageIndex === 0) {
          draft[key] = [data];
          return;
        }

        const pages = draft[key] as Data[];
        pages[pageIndex] = data;
      },
    });
  }

  function mutate<Arg, Data, E = unknown>(
    accessor: BaseAccessor<AutoState, Arg, Data, E>,
    fn: (prevData: Data | undefined) => Data,
    serverStateKey?: object
  ) {
    const key = accessor.getKey();
    const prevData = model.getState(serverStateKey)[key] as Data | undefined;
    const newData = fn(prevData);
    model.mutate(draft => {
      draft[key] = newData;
    }, serverStateKey);
  }

  function getState<Arg, Data, E = unknown>(
    accessor: BaseAccessor<AutoState, Arg, Data, E>,
    serverStateKey?: object
  ) {
    const key = accessor.getKey();
    const cache = model.getState(serverStateKey)[key] as Data | undefined;

    return cache;
  }

  return {
    ...model,
    defineAccessor,
    defineInfiniteAccessor,
    mutate,
    getState,
  };
}
