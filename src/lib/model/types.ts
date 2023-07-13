import type { Draft } from 'immer';

interface BaseAction<Arg, D, E> {
  onError?: (info: { error: E; arg: Arg }) => void;
  onSuccess?: (info: { data: D; arg: Arg }) => void;
  /**
   * @internal
   */
  prefix?: number;
  /**
   * @internal
   */
  isLazy?: boolean;
}

export interface NormalAction<S, Arg = any, Data = any, E = unknown>
  extends BaseAction<Arg, Data, E> {
  fetchData: (arg: Arg) => Promise<Data>;
  syncState: (
    draft: Draft<S>,
    payload: {
      startAt: number;
      arg: Arg;
      data: Data;
    }
  ) => void;
}

export interface InfiniteAction<S, Arg = any, Data = any, E = unknown>
  extends BaseAction<Arg, Data[], E> {
  fetchData: (
    arg: Arg,
    meta: { previousData: Data | null; pageIndex: number }
  ) => Promise<Data | null>;
  syncState: (
    draft: Draft<S>,
    payload: { data: Data; arg: Arg; pageSize: number; pageIndex: number }
  ) => void;
}

export type Action<S, Arg = any, Data = any, E = unknown> =
  | NormalAction<S, Arg, Data, E>
  | InfiniteAction<S, Arg, Data, E>;

export type ModelSubscribe = (listener: () => void) => () => void;

export interface BaseConstructorArgs<S, Arg> {
  arg: Arg;
  updateState: (cb: (draft: Draft<S>) => void) => void;
  getState: (serverStateKey?: object) => S;
  modelSubscribe: ModelSubscribe;
  notifyModel: () => void;
  onMount: () => void;
  onUnmount: () => void;
  prefix: number;
  isLazy: boolean;
}

export interface NormalConstructorArgs<S, Arg, Data, E> extends BaseConstructorArgs<S, Arg> {
  action: NormalAction<S, Arg, Data, E>;
}

export interface InfiniteConstructorArgs<S, Arg, Data, E> extends BaseConstructorArgs<S, Arg> {
  action: InfiniteAction<S, Arg, Data, E>;
  initialPageNum: number;
}
