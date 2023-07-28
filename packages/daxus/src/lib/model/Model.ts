import { createDraft, finishDraft } from 'immer';
import type { Draft } from 'immer';
import type {
  InfiniteAction,
  NormalAction,
  InfiniteConstructorArgs,
  NormalConstructorArgs,
  UpdateModelState,
  UpdateModelStateContext,
} from './types.js';
import { NormalAccessor } from './NormalAccessor.js';
import { InfiniteAccessor } from './InfiniteAccessor.js';
import { getKey, isServer, objectKeys } from '../utils/index.js';
import type { Accessor } from './Accessor.js';

const CLEAR_ACCESSOR_CACHE_TIME = 60 * 1000;

interface BaseAccessorCreator<S> {
  mutate: (fn: (draft: Draft<S>) => void) => void;
  invalidate(): void;
}

export type AutoState = Record<string, unknown>;

export type AutoNormalAction<Arg, Data, E> = Omit<
  NormalAction<AutoState, Arg, Data, E>,
  'syncState'
>;

export type AutoInfiniteAction<Arg, Data, E> = Omit<
  InfiniteAction<AutoState, Arg, Data, E>,
  'syncState'
>;

export interface NormalAccessorCreator<S, Arg = any, Data = any, E = any>
  extends BaseAccessorCreator<S> {
  (arg: Arg): NormalAccessor<S, Arg, Data, E>;
  syncState: NormalAction<S, Arg, Data, E>['syncState'];
}
export interface InfiniteAccessorCreator<S, Arg = any, Data = any, E = any>
  extends BaseAccessorCreator<S> {
  (arg: Arg): InfiniteAccessor<S, Arg, Data, E>;
  syncState: InfiniteAction<S, Arg, Data, E>['syncState'];
}

export interface Model<S extends object> {
  getCreator(
    creatorName: string
  ): InfiniteAccessorCreator<S> | NormalAccessorCreator<S> | undefined;
  mutate(fn: (draft: Draft<S>) => void, serverStateKey?: object): void;
  defineInfiniteAccessor<Data, Arg = void, E = any>(
    action: InfiniteAction<S, Arg, Data, E>
  ): InfiniteAccessorCreator<S, Arg, Data, E>;
  defineNormalAccessor<Data, Arg = void, E = any>(
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

export interface AutoModel
  extends Pick<Model<AutoState>, 'invalidate' | 'subscribe' | 'getCreator'> {
  mutate<Arg, Data, E = unknown>(
    accessor: Accessor<AutoState, Arg, Data, E>,
    fn: (prevData: Data | undefined) => Data,
    serverStateKey?: object
  ): void;
  defineNormalAccessor<Data, Arg = void, E = unknown>(
    action: AutoNormalAction<Arg, Data, E>
  ): NormalAccessorCreator<AutoState, Arg, Data, E>;
  defineInfiniteAccessor<Data, Arg = void, E = unknown>(
    action: AutoInfiniteAction<Arg, Data, E>
  ): InfiniteAccessorCreator<AutoState, Arg, Data, E>;
  getState<Arg, Data, E = unknown>(
    accessor: Accessor<AutoState, Arg, Data, E>,
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
  type Accessor<Arg = any, Data = any> =
    | NormalAccessor<S, Arg, Data, any>
    | InfiniteAccessor<S, Arg, Data, any>;

  const serverStateRecord = new WeakMap<object, S>();
  let clientState = { ...initialState };
  const listeners: (() => void)[] = [];
  const accessorRecord = {} as Record<string, Accessor>;
  const creatorRecord = {} as Record<
    string,
    NormalAccessorCreator<S, any, any, any> | InfiniteAccessorCreator<S, any, any, any>
  >;

  function assertDuplicateName(name: string) {
    if (objectKeys(creatorRecord).includes(name)) {
      throw new Error(`The creator name: ${name} has already existed!`);
    }
  }

  /**
   * instead of recording the whole data, we only record the pages number to save the memory usage
   */
  const infiniteAccessorPageNumRecord = {} as Record<string, number | undefined>;

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

  function defineNormalAccessor<Arg, Data, E = unknown>(
    action: NormalAction<S, Arg, Data, E>
  ): NormalAccessorCreator<S, Arg, Data, E> {
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

      const constructorArgs: NormalConstructorArgs<S, Arg, Data, E> = {
        arg,
        action,
        updateState,
        getState,
        modelSubscribe: subscribe,
        notifyModel: notifyListeners,
        onMount,
        onUnmount,
        isAuto: action.isAuto ?? false,
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
        modelSubscribe: subscribe,
        notifyModel: notifyListeners,
        updateState,
        onMount,
        onUnmount,
        initialPageNum: infiniteAccessorPageNumRecord[key] ?? 1,
        isAuto: action.isAuto ?? false,
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
    defineNormalAccessor,
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

  function defineNormalAccessor<Arg, Data, E = unknown>(action: AutoNormalAction<Arg, Data, E>) {
    const { name } = action;
    return model.defineNormalAccessor({
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
    accessor: Accessor<AutoState, Arg, Data, E>,
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
    accessor: Accessor<AutoState, Arg, Data, E>,
    serverStateKey?: object
  ) {
    const key = accessor.getKey();
    const cache = model.getState(serverStateKey)[key] as Data | undefined;

    return cache;
  }

  return {
    ...model,
    defineNormalAccessor,
    defineInfiniteAccessor,
    mutate,
    getState,
  };
}
