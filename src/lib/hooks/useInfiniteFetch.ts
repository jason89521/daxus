import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import type { InfiniteModelAccessor, Cache } from '../model';
import { objectKeys, stableHash } from '../utils';

type StateDeps<D> = Partial<Record<keyof Cache<D>, boolean>>;

export function useInfiniteFetch<M, Arg, RD, D = any>(
  accessor: InfiniteModelAccessor<M, Arg, RD>,
  getSnapshot: (model: M) => D
) {
  const stateDeps = useRef<StateDeps<RD[]>>({}).current;
  const { isFetching } = useSyncExternalStore(
    useCallback(
      storeListener => {
        return accessor.subscribe((prev, current) => {
          for (const key of objectKeys(stateDeps)) {
            if (key === 'data') continue;
            if (prev[key] !== current[key]) {
              storeListener();
              return;
            }
          }
        });
      },
      [accessor, stateDeps]
    ),
    accessor.getCache
  );
  const data = useSyncExternalStore(
    useCallback(
      storeListener => {
        return accessor.subscribe((prev, current) => {
          if (!stateDeps.data) return;
          if (stableHash(current.data) !== stableHash(prev.data)) {
            storeListener();
          }
        });
      },
      [accessor, stateDeps]
    ),
    () => {
      return getSnapshot(accessor.getModel());
    }
  );

  const fetchNextPage = useCallback(() => {
    accessor.fetchNext();
  }, [accessor]);

  useEffect(() => {
    // Fetch the first page.
    accessor.revalidate();
  }, [accessor]);

  return {
    fetchNextPage,
    get data() {
      stateDeps.data = true;
      return data;
    },
    get isFetching() {
      stateDeps.isFetching = true;
      return isFetching;
    },
  };
}
