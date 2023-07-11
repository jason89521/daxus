import type { Accessor } from '../model/Accessor.js';
import type { InfiniteAccessor } from '../model/InfiniteAccessor.js';
import type { LazyState } from '../model/Model.js';
import type { NormalAccessor } from '../model/NormalAccessor.js';
import type { AccessorOptions, UseAccessorReturn } from './types.js';
import { useAccessor } from './useAccessor.js';

export function useLazyAccessor<Arg, Data, E, SS = Data | undefined>(
  accessor: NormalAccessor<LazyState, Arg, Data, E>,
  getSnapshot?: (data: Data | undefined) => SS,
  options?: AccessorOptions<SS>
): UseAccessorReturn<SS | undefined, E, NormalAccessor<LazyState, Arg, Data, E>>;
export function useLazyAccessor<Arg, Data, E, SS = Data | undefined>(
  accessor: NormalAccessor<LazyState, Arg, Data, E> | null,
  getSnapshot?: (data: Data | undefined) => SS,
  options?: AccessorOptions<SS>
): UseAccessorReturn<SS | undefined, E, NormalAccessor<LazyState, Arg, Data, E> | null>;
export function useLazyAccessor<Arg, Data, E, SS = Data[] | undefined>(
  accessor: InfiniteAccessor<LazyState, Arg, Data, E>,
  getSnapshot?: (data: Data | undefined[]) => SS,
  options?: AccessorOptions<SS>
): UseAccessorReturn<SS | undefined, E, InfiniteAccessor<LazyState, Arg, Data, E>>;
export function useLazyAccessor<Arg, Data, E, SS = Data[] | undefined>(
  accessor: InfiniteAccessor<LazyState, Arg, Data, E> | null,
  getSnapshot?: (data: Data | undefined[]) => SS,
  options?: AccessorOptions<SS>
): UseAccessorReturn<SS | undefined, E, InfiniteAccessor<LazyState, Arg, Data, E> | null>;
export function useLazyAccessor<Arg, D, SS, E = unknown>(
  accessor: Accessor<LazyState, D, E> | null,
  getSnapshot = (data: any) => data,
  options = {}
) {
  return useAccessor<LazyState, Arg, D, SS, E>(
    accessor as any,
    state => {
      return getSnapshot(state[accessor!.getKey()]) as SS;
    },
    options
  ) as any;
}
