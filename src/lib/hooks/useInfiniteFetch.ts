import { useCallback, useEffect, useSyncExternalStore } from 'react';
import type { InfiniteModelAccessor } from '../model';

export function useInfiniteFetch<M, Arg, RD, D = any>(
  accessor: InfiniteModelAccessor<M, Arg, RD>,
  getSnapshot: (model: M) => D
) {
  const data = useSyncExternalStore(accessor.subscribe, () => {
    return getSnapshot(accessor.getModel());
  });

  const fetchNextPage = useCallback(() => {
    const currentPageSize = accessor.pageSize();
    accessor.fetch({ pageSize: currentPageSize + 1 });
  }, [accessor]);

  useEffect(() => {
    // Fetch the first page.
    accessor.fetch({ pageSize: 1 });
  }, [accessor]);

  return { data, fetchNextPage };
}
