import type { Draft } from 'immer';

export type Action<Model, Arg = any, Data = any> = {
  fetchData: (arg: Arg) => Promise<Data>;
  syncModel: (model: Draft<Model>, payload: { remoteData: Data; arg: Arg }) => void;
  onError?: (info: { error: unknown; arg: Arg }) => void;
};

export type InfiniteAction<Model, Arg = any, Data = any> = {
  fetchData: (arg: Arg, previousData: Data | null) => Promise<Data>;
  syncModel: (
    model: Draft<Model>,
    payload: { remoteData: Data; arg: Arg; pageSize: number; pageIndex: number }
  ) => void;
};

export type ArgFromAction<A extends Action<any>> = Parameters<A['fetchData']>[0];

export type RemoteDataFromAction<A extends Action<any>> = Awaited<ReturnType<A['fetchData']>>;

export type Listener = () => void;
