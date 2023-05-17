import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import type { ModelAccessor, Status } from '../model';
import { objectKeys, stableHash } from '../utils';

type StateDeps = Partial<Record<keyof Status, boolean>>;

export function useModelAccessor<M, D>(accessor: ModelAccessor<M>, getSnapshot: (model: M) => D) {
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

  return { stateDeps, status, data };
}
