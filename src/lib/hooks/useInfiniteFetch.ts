import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import type { InfiniteModelAccessor, Status } from '../model';
import { objectKeys, stableHash } from '../utils';

type StateDeps = Partial<Record<keyof Status, boolean>>;

export function useInfiniteFetch<M, Arg, RD, D = any>(
  accessor: InfiniteModelAccessor<M, Arg, RD>,
  getSnapshot: (model: M) => D
) {
  const stateDeps = useRef<StateDeps>({}).current;
  const getSnapshotRef = useRef(getSnapshot);
  const { isFetching } = useSyncExternalStore(
    useCallback(
      storeListener => {
        return accessor.subscribe((prev, current) => {
          for (const key of objectKeys(stateDeps)) {
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

  const [subscribeData, getData] = useMemo(() => {
    let memoizedSnapshot = getSnapshotRef.current(accessor.getModel());

    return [
      (listener: () => void) => {
        return accessor.subscribeData(() => {
          const snapshot = getSnapshotRef.current(accessor.getModel());
          if (stableHash(snapshot) !== stableHash(memoizedSnapshot)) {
            memoizedSnapshot = snapshot;
            listener();
          }
        });
      },
      () => memoizedSnapshot,
    ] as const;
  }, [accessor]);

  const data = useSyncExternalStore(subscribeData, getData);

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
      return data;
    },
    get isFetching() {
      stateDeps.isFetching = true;
      return isFetching;
    },
  };
}
