import { useCallback } from 'react';
import type { InfiniteModelAccessor } from '../model';
import { useModelAccessor } from './useModelAccessor';
import type { FetchOptions } from './types';

export function useInfiniteFetch<M, Arg, RD, D = any, E = unknown>(
  accessor: InfiniteModelAccessor<M, Arg, RD, E>,
  getSnapshot: (model: M) => D,
  options: FetchOptions<D> = {}
) {
  const { stateDeps, status, data } = useModelAccessor(accessor, getSnapshot, options);
  const { isFetching, error } = status;

  const fetchNextPage = useCallback(() => {
    accessor.fetchNext();
  }, [accessor]);

  return {
    fetchNextPage,
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
  };
}
