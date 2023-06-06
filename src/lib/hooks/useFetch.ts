import type { NormalModelAccessor } from '../model';
import { useModelAccessor } from './useModelAccessor';
import type { FetchOptions, HookReturn } from './types';

export function useFetch<M, Arg, RD, D = any, E = unknown>(
  accessor: NormalModelAccessor<M, Arg, RD, E>,
  getSnapshot: (model: M) => D,
  options?: FetchOptions<D>
): HookReturn<D, E>;
export function useFetch<M, Arg, RD, D = any, E = unknown>(
  accessor: NormalModelAccessor<M, Arg, RD, E> | null,
  getSnapshot: (model: M) => D,
  options?: FetchOptions<D>
): HookReturn<D | undefined, E>;
export function useFetch<M, Arg, RD, D = any, E = unknown>(
  accessor: NormalModelAccessor<M, Arg, RD, E> | null,
  getSnapshot: (model: M) => D,
  options: FetchOptions = {}
) {
  const { stateDeps, status, data, revalidate } = useModelAccessor(accessor, getSnapshot, options);
  const { isFetching, error } = status;

  return {
    get data() {
      return data;
    },
    get isFetching() {
      stateDeps.isFetching = true;
      return isFetching;
    },
    get error() {
      stateDeps.error = true;
      return error;
    },
    revalidate,
  };
}
