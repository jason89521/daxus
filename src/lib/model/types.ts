import type { Draft } from 'immer';

interface BasePayload<Arg, Data> {
  startAt: number;
  arg: Arg;
  data: Data;
}

interface InfinitePayload<Arg, Data> extends BasePayload<Arg, Data> {
  previousData: Data | null;
  pageIndex: number;
}

interface BaseAction<Arg, D, E> {
  onError?: (info: { error: E; arg: Arg }) => void;
  onSuccess?: (info: { data: D; arg: Arg }) => void;
}

export interface NormalAction<S, Arg = any, Data = any, E = unknown>
  extends BaseAction<Arg, Data, E> {
  fetchData: (arg: Arg) => Promise<Data>;
  syncState: (draft: Draft<S>, payload: BasePayload<Arg, Data>) => void;
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

export type Listener = () => void;
