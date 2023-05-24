import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import type { InfiniteModelAccessor, NormalModelAccessor, Status } from '../model';
import { isUndefined, objectKeys, stableHash } from '../utils';
import type { FetchOptions } from './types';
import { useUpdatedRef } from './useUpdatedRef';

type StateDeps = Partial<Record<keyof Status, boolean>>;
type Accessor<M, E> = NormalModelAccessor<M, any, any, E> | InfiniteModelAccessor<M, any, any, E>;

export function useModelAccessor<M, D, E = unknown>(
  accessor: Accessor<M, E>,
  getSnapshot: (model: M) => D,
  options: FetchOptions<D> = {}
) {
  const {
    revalidateOnFocus = true,
    revalidateOnReconnect = true,
    retryCount = 3,
    revalidateIfStale = true,
    dedupeInterval = 2000,
    checkHasStaleDataFn = (value: unknown) => !isUndefined(value),
  } = options;
  const stateDeps = useRef<StateDeps>({}).current;
  const getSnapshotRef = useUpdatedRef(getSnapshot);
  const status = useSyncExternalStore(
    useCallback(
      listener => {
        return accessor.subscribeStatus((prev, current) => {
          for (const key of objectKeys(stateDeps)) {
            if (prev[key] !== current[key]) {
              listener();
              return;
            }
          }
        });
      },
      [accessor, stateDeps]
    ),
    accessor.getStatus,
    accessor.getStatus
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
  }, [accessor, getSnapshotRef]);

  const data = useSyncExternalStore(subscribeData, getData, getData);
  const hasStaleData = checkHasStaleDataFn(data);
  const shouldRevalidate = (() => {
    // Always revalidate if `revalidateIfStale` is `true`.
    if (revalidateIfStale) return true;
    // If there is no stale data, we should fetch the data.
    if (!hasStaleData) return true;

    return false;
  })();

  useEffect(() => {
    accessor.setRetryCount(retryCount);
  }, [accessor, retryCount]);

  useEffect(() => {
    accessor.setDedupeInterval(dedupeInterval);
  }, [accessor, dedupeInterval]);

  useEffect(() => {
    if (revalidateOnFocus) {
      return accessor.registerRevalidateOnFocus();
    }
  }, [accessor, revalidateOnFocus]);

  useEffect(() => {
    if (revalidateOnReconnect) {
      return accessor.registerRevalidateOnReconnect();
    }
  }, [accessor, revalidateOnReconnect]);

  useEffect(() => {
    if (shouldRevalidate) {
      accessor.revalidate();
    }
  }, [accessor, shouldRevalidate]);

  return { stateDeps, status, data, hasStaleData };
}
