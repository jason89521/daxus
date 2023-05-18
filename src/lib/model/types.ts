import type { Draft } from 'immer';

interface BaseAction<Arg, D> {
  onError?: (info: { error: unknown; arg: Arg }) => void;
  onSuccess?: (info: { data: D; arg: Arg }) => void;
}

export interface NormalAction<Model, Arg = any, Data = any> extends BaseAction<Arg, Data> {
  type: 'normal';
  fetchData: (arg: Arg) => Promise<Data>;
  syncModel: (model: Draft<Model>, payload: { data: Data; arg: Arg }) => void;
}

export interface InfiniteAction<Model, Arg = any, Data = any> extends BaseAction<Arg, Data[]> {
  type: 'infinite';
  fetchData: (
    arg: Arg,
    meta: { previousData: Data | null; pageIndex: number }
  ) => Promise<Data | null>;
  syncModel: (
    model: Draft<Model>,
    payload: { data: Data; arg: Arg; pageSize: number; pageIndex: number }
  ) => void;
}

export type Action<Model, Arg = any, Data = any> =
  | NormalAction<Model, Arg, Data>
  | InfiniteAction<Model, Arg, Data>;

export type ArgFromAction<A extends Action<any>> = Parameters<A['fetchData']>[0];

export type RemoteDataFromAction<A extends Action<any>> = Awaited<ReturnType<A['fetchData']>>;

export type Listener = () => void;
