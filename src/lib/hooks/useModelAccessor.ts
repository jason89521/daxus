import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import type { InfiniteModelAccessor, NormalModelAccessor, Status } from '../model';
import { objectKeys, stableHash } from '../utils';
import type { FetchOptions } from './types';

type StateDeps = Partial<Record<keyof Status, boolean>>;
type Accessor<M> = NormalModelAccessor<M> | InfiniteModelAccessor<M>;

export function useModelAccessor<M, D>(
  accessor: Accessor<M>,
  getSnapshot: (model: M) => D,
  options: FetchOptions = {}
) {
  const { revalidateOnFocus = true, revalidateOnReconnect = true, retryCount = 3 } = options;
  const stateDeps = useRef<StateDeps>({}).current;
  const getSnapshotRef = useRef(getSnapshot);
  getSnapshotRef.current = getSnapshot;
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
  }, [accessor]);

  const data = useSyncExternalStore(subscribeData, getData, getData);

  useEffect(() => {
    accessor.setRetryCount(retryCount);
  }, [accessor, retryCount]);

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

  return { stateDeps, status, data };
}
