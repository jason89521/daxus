import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import type { Status, NormalModelAccessor } from '../model';
import { objectKeys, stableHash } from '../utils';

type StateDeps = Partial<Record<keyof Status, boolean>>;

export function useFetch<M, Arg, RD, D = any>(
  accessor: NormalModelAccessor<M, Arg, RD>,
  getSnapshot: (model: M) => D,
  options: {
    revalidateOnFocus?: boolean;
    revalidateOnReconnect?: boolean;
  } = {}
) {
  const { revalidateOnFocus = true, revalidateOnReconnect = true } = options;
  const stateDeps = useRef<StateDeps>({}).current;
  const getSnapshotRef = useRef(getSnapshot);
  getSnapshotRef.current = getSnapshot;
  const { isFetching } = useSyncExternalStore(
    useCallback(
      storeListener => {
        return accessor.subscribeStatus((prev, current) => {
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

  const data = useSyncExternalStore(subscribeData, getData);

  useEffect(() => {
    accessor.revalidate();
  }, [accessor]);

  useEffect(() => {
    if (revalidateOnFocus) {
      return accessor.registerRevalidateOnFocus();
    }
  }, [revalidateOnFocus, accessor]);

  useEffect(() => {
    if (revalidateOnReconnect) {
      return accessor.registerRevalidateOnReconnect();
    }
  }, [revalidateOnReconnect, accessor]);

  return {
    get data() {
      return data;
    },
    get isFetching() {
      stateDeps.isFetching = true;
      return isFetching;
    },
  };
}
