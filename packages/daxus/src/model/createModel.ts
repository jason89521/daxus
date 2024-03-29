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

const CLEAR_ACCESSOR_CACHE_TIME = 60 * 1000;

interface BaseAccessorCreator<S> {
  mutate: (fn: (draft: Draft<S>) => void) => void;
  invalidate(): void;
}

export interface AccessorCreator<S, Arg = any, Data = any, E = any> extends BaseAccessorCreator<S> {
  (arg: Arg): Accessor<S, Arg, Data, E>;
  syncState: Action<S, Arg, Data, E>['syncState'];
}
export interface InfiniteAccessorCreator<S, Arg = any, Data = any, E = any>
  extends BaseAccessorCreator<S> {
  (arg: Arg): InfiniteAccessor<S, Arg, Data, E>;
  syncState: InfiniteAction<S, Arg, Data, E>['syncState'];
}

interface ServerStateChangeContext extends Omit<UpdateModelStateContext, 'serverStateKey'> {
  serverStateKey: object;
}

export interface CreateModelOptions<S> {
  initialState: S;
  /**
   * @internal
   */
  onServerStateChange?: (ctx: ServerStateChangeContext) => void;
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

export function createModel<S extends object>({
  initialState,
  onServerStateChange,
}: CreateModelOptions<S>): Model<S> {
  const serverStateRecord = new WeakMap<object, S>();
  let clientState = Array.isArray(initialState) ? ([...initialState] as S) : { ...initialState };
  let creatorCounter = 0;
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
   * Record the fetched data of the infinite accessors.
   */
  const infiniteAccessorDataRecord = {} as Record<string, any[]>;

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
      onServerStateChange?.({ ...ctx, serverStateKey });
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
    creatorCounter += 1;
    const { name = `${creatorCounter}` } = action;
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
        creatorName: name,
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
    creatorCounter += 1;
    const { name = `${creatorCounter}` } = action;
    assertDuplicateName(name);
    let timeoutId: number | undefined;
    const main = (arg: Arg) => {
      const key = getKey(name, arg);

      const clearAccessorCache = () => {
        const accessor = accessorRecord[key] as InfiniteAccessor<S>;
        if (!accessor) return;
        // Don't delete the accessor if it is mounted.
        if (accessor.isMounted()) return;
        infiniteAccessorDataRecord[key] = accessor.getData();
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
        isAuto: action.isAuto ?? false,
        setStaleTime: compositeSetStale(key),
        data: infiniteAccessorDataRecord[key] ?? [],
        getIsStale() {
          return isStaleRecord[key] ?? false;
        },
        creatorName: name,
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
