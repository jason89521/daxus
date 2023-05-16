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
    accessor.fetchNext();
  }, [accessor]);

  useEffect(() => {
    // Fetch the first page.
    accessor.revalidate();
  }, [accessor]);

  return { data, fetchNextPage };
}
