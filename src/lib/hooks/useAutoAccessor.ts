import type { Accessor } from '../model/Accessor.js';
import type { InfiniteAccessor } from '../model/InfiniteAccessor.js';
import type { AutoState } from '../model/Model.js';
import type { NormalAccessor } from '../model/NormalAccessor.js';
import type { AutoAccessorOptions, UseAccessorReturn } from './types.js';
import { useAccessor } from './useAccessor.js';

export function useAutoAccessor<Arg, D, E, SS = D | undefined>(
  accessor: NormalAccessor<AutoState, Arg, D, E>,
  options?: AutoAccessorOptions<D, SS>
): UseAccessorReturn<SS | undefined, E, NormalAccessor<AutoState, Arg, D, E>>;
export function useAutoAccessor<Arg, D, E, SS = D | undefined>(
  accessor: NormalAccessor<AutoState, Arg, D, E> | null,
  options?: AutoAccessorOptions<D, SS>
): UseAccessorReturn<SS | undefined, E, NormalAccessor<AutoState, Arg, D, E> | null>;
export function useAutoAccessor<Arg, D, E, SS = D[] | undefined>(
  accessor: InfiniteAccessor<AutoState, Arg, D, E>,
  options?: AutoAccessorOptions<D[], SS>
): UseAccessorReturn<SS | undefined, E, InfiniteAccessor<AutoState, Arg, D, E>>;
export function useAutoAccessor<Arg, D, E, SS = D[] | undefined>(
  accessor: InfiniteAccessor<AutoState, Arg, D, E> | null,
  options?: AutoAccessorOptions<D[], SS>
): UseAccessorReturn<SS | undefined, E, InfiniteAccessor<AutoState, Arg, D, E> | null>;
export function useAutoAccessor<Arg, D, SS, E = unknown>(
  accessor: Accessor<AutoState, Arg, D, E> | null,
  options: AutoAccessorOptions<D, SS> = {}
) {
  const { getSnapshot = data => data, ...originalOptions } = options;

  return useAccessor<AutoState, Arg, D, SS, E>(
    accessor as any,
    state => {
      return getSnapshot(state[accessor!.getKey()] as D | undefined) as SS;
    },
    originalOptions
  ) as any;
}
