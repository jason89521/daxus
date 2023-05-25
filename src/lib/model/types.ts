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

export interface NormalAction<Model, Arg = any, Data = any, E = unknown>
  extends BaseAction<Arg, Data, E> {
  fetchData: (arg: Arg) => Promise<Data>;
  syncModel: (model: Draft<Model>, payload: BasePayload<Arg, Data>) => void;
}

export interface InfiniteAction<Model, Arg = any, Data = any, E = unknown>
  extends BaseAction<Arg, Data[], E> {
  fetchData: (
    arg: Arg,
    meta: { previousData: Data | null; pageIndex: number }
  ) => Promise<Data | null>;
  /**
   * It is guaranteed that the former data will be passed before the later data.
   * @param model
   * @param payload
   * @returns
   */
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
