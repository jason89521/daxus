import type { Draft } from 'immer';

export type FetchObject<Model, Arg = any, Data = any> = {
  fetchData: (arg: Arg) => Promise<Data>;
  syncModel: (model: Draft<Model>, payload: { remoteData: Data; arg: Arg }) => void;
};

export type ArgFromFetchObject<FO extends FetchObject<any>> = Parameters<FO['fetchData']>[1];
