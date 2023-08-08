import { getKey } from '../utils/index.js';
import type { BaseAccessor } from './BaseAccessor.js';
import {
  createModel,
  type AccessorCreator,
  type CreateModelOptions,
  type InfiniteAccessorCreator,
  type Model,
} from './createModel.js';
import type { Action, InfiniteAction } from './types.js';

export type AutoState = Record<string, unknown>;

export type AutoAction<Arg, Data, E> = Omit<Action<AutoState, Arg, Data, E>, 'syncState'>;

export type AutoInfiniteAction<Arg, Data, E> = Omit<
  InfiniteAction<AutoState, Arg, Data, E>,
  'syncState'
>;

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

export type CreateAutoModelOptions = Omit<CreateModelOptions<AutoState>, 'initialState'>;

export function createAutoModel({ onServerStateChange }: CreateAutoModelOptions = {}): AutoModel {
  const model = createModel<AutoState>({ initialState: {}, onServerStateChange });
  let creatorCounter = 0;

  function defineAccessor<Arg, Data, E = unknown>(action: AutoAction<Arg, Data, E>) {
    creatorCounter += 1;
    const { name = `auto_${creatorCounter}` } = action;
    return model.defineAccessor({
      ...action,
      isAuto: true,
      name,
      syncState(draft, { data, arg }) {
        const key = getKey(name, arg);
        draft[key] = data;
      },
    });
  }

  function defineInfiniteAccessor<Arg, Data, E = unknown>(
    action: AutoInfiniteAction<Arg, Data, E>
  ) {
    creatorCounter += 1;
    const { name = `auto_${creatorCounter}` } = action;
    return model.defineInfiniteAccessor({
      ...action,
      isAuto: true,
      name,
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
