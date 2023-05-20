import { useCallback } from 'react';
import type { InfiniteModelAccessor } from '../model';
import { useModelAccessor } from './useModelAccessor';
import type { FetchOptions } from './types';

export function useInfiniteFetch<M, Arg, RD, D = any>(
  accessor: InfiniteModelAccessor<M, Arg, RD>,
  getSnapshot: (model: M) => D,
  options: FetchOptions = {}
) {
  const { stateDeps, status, data } = useModelAccessor(accessor, getSnapshot, options);
  const { isFetching } = status;

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
  };
}
