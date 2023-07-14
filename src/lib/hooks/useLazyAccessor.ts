import type { Accessor } from '../model/Accessor.js';
import type { InfiniteAccessor } from '../model/InfiniteAccessor.js';
import type { LazyState } from '../model/Model.js';
import type { NormalAccessor } from '../model/NormalAccessor.js';
import type { LazyAccessorOptions, UseAccessorReturn } from './types.js';
import { useAccessor } from './useAccessor.js';

export function useLazyAccessor<Arg, D, E, SS = D | undefined>(
  accessor: NormalAccessor<LazyState, Arg, D, E>,
  options?: LazyAccessorOptions<D, SS>
): UseAccessorReturn<SS | undefined, E, NormalAccessor<LazyState, Arg, D, E>>;
export function useLazyAccessor<Arg, D, E, SS = D | undefined>(
  accessor: NormalAccessor<LazyState, Arg, D, E> | null,
  options?: LazyAccessorOptions<D, SS>
): UseAccessorReturn<SS | undefined, E, NormalAccessor<LazyState, Arg, D, E> | null>;
export function useLazyAccessor<Arg, D, E, SS = D[] | undefined>(
  accessor: InfiniteAccessor<LazyState, Arg, D, E>,
  options?: LazyAccessorOptions<D[], SS>
): UseAccessorReturn<SS | undefined, E, InfiniteAccessor<LazyState, Arg, D, E>>;
export function useLazyAccessor<Arg, D, E, SS = D[] | undefined>(
  accessor: InfiniteAccessor<LazyState, Arg, D, E> | null,
  options?: LazyAccessorOptions<D[], SS>
): UseAccessorReturn<SS | undefined, E, InfiniteAccessor<LazyState, Arg, D, E> | null>;
export function useLazyAccessor<Arg, D, SS, E = unknown>(
  accessor: Accessor<LazyState, D, E> | null,
  options: LazyAccessorOptions<D, SS> = {}
) {
  const { getSnapshot = data => data, ...originalOptions } = options;

  return useAccessor<LazyState, Arg, D, SS, E>(
    accessor as any,
    state => {
      return getSnapshot(state[accessor!.getKey()] as D | undefined) as SS;
    },
    originalOptions
  ) as any;
}
