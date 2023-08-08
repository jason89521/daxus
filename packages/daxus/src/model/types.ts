import type { Draft } from 'immer';

export interface BaseAction<Arg, D, E> {
  onError?: (info: { error: E; arg: Arg }) => void;
  onSuccess?: (info: { data: D; arg: Arg }) => void;
  /**
   * @internal
   */
  isAuto?: boolean;
  /**
   * @internal
   */
  name?: string;
}

export interface Action<S, Arg = any, Data = any, E = unknown> extends BaseAction<Arg, Data, E> {
  fetchData: (arg: Arg, context: { getState: () => S }) => Promise<Data>;
  syncState: (
    draft: Draft<S>,
    payload: {
      arg: Arg;
      data: Data;
    }
  ) => void;
}

export interface InfiniteAction<S, Arg = any, Data = any, E = unknown>
  extends BaseAction<Arg, Data[], E> {
  fetchData: (
    arg: Arg,
    context: { previousData: Data | null; pageIndex: number; getState: () => S }
  ) => Promise<Data | null>;
  syncState: (
    draft: Draft<S>,
    payload: { data: Data; arg: Arg; pageSize: number; pageIndex: number }
  ) => void;
}

export type Subscribe = (listener: () => void) => () => void;

export interface BaseConstructorArgs<S, Arg> {
  arg: Arg;
  updateState: UpdateModelState<S>;
  getState: (serverStateKey?: object) => S;
  subscribeModel: Subscribe;
  notifyModel: () => void;
  onMount: () => void;
  onUnmount: () => void;
  setStaleTime: (staleTime: number) => void;
  getIsStale: () => boolean;
  isAuto: boolean;
  creatorName: string;
}

export interface ConstructorArgs<S, Arg, Data, E> extends BaseConstructorArgs<S, Arg> {
  action: Action<S, Arg, Data, E>;
}

export interface InfiniteConstructorArgs<S, Arg, Data, E> extends BaseConstructorArgs<S, Arg> {
  action: InfiniteAction<S, Arg, Data, E>;
  initialPageNum: number;
}

export type NotifyDatabaseContext = {
  serverStateKey: object;
  modelName: string;
  creatorName: string;
  data: any;
  arg?: any;
  pageSize?: number;
  pageIndex?: number;
};

export type UpdateModelStateContext = {
  serverStateKey?: object;
  creatorName?: string;
  data?: any;
  arg?: any;
  pageSize?: number;
  pageIndex?: number;
};

export type UpdateModelState<S> = (
  cb: (draft: Draft<S>) => void,
  context: UpdateModelStateContext
) => void;
