import { useCallback, useEffect } from 'react';
import type { InfiniteModelAccessor } from '../model';
import { useModelAccessor } from './useModelAccessor';
import type { FetchOption } from './types';

export function useInfiniteFetch<M, Arg, RD, D = any>(
  accessor: InfiniteModelAccessor<M, Arg, RD>,
  getSnapshot: (model: M) => D,
  options: FetchOption = {}
) {
  const { stateDeps, status, data } = useModelAccessor(accessor, getSnapshot);
  const { revalidateOnFocus = true, revalidateOnReconnect = true, retryCount = 5 } = options;
  const { isFetching } = status;

  const fetchNextPage = useCallback(() => {
    accessor.fetchNext();
  }, [accessor]);

  useEffect(() => {
    accessor.setRetryCount(retryCount);
  }, [accessor, retryCount]);

  useEffect(() => {
    // Fetch the first page.
    accessor.revalidate();
  }, [accessor]);

  useEffect(() => {
    return accessor.registerRevalidateOnFocus();
  }, [revalidateOnFocus, accessor]);

  useEffect(() => {
    return accessor.registerRevalidateOnReconnect();
  }, [revalidateOnReconnect, accessor]);

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
