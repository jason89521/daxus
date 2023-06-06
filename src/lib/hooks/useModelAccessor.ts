import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import type { InfiniteModelAccessor, NormalModelAccessor, Status } from '../model';
import { isUndefined, noop, objectKeys, stableHash } from '../utils';
import type { FetchOptions } from './types';
import { useUpdatedRef } from './useUpdatedRef';
import { isNull } from '../utils/isNull';

type StateDeps = Partial<Record<keyof Status, boolean>>;
type Accessor<M, E> = NormalModelAccessor<M, any, any, E> | InfiniteModelAccessor<M, any, any, E>;
type ReturnValue<D, E> = {
  stateDeps: StateDeps;
  status: Status<E>;
  data: D;
  revalidate: () => void;
};

const defaultStatus: Status = { isFetching: false, error: null };

export function useModelAccessor<M, D, E = unknown>(
  accessor: Accessor<M, E>,
  getSnapshot: (model: M) => D,
  options?: FetchOptions<D>
): ReturnValue<D, E>;
export function useModelAccessor<M, D, E = unknown>(
  accessor: Accessor<M, E> | null,
  getSnapshot: (model: M) => D,
  options?: FetchOptions<D>
): ReturnValue<D | undefined, E>;
export function useModelAccessor<M, D, E = unknown>(
  accessor: Accessor<M, E> | null,
  getSnapshot: (model: M) => D,
  options: FetchOptions<D> = {}
) {
  const {
    revalidateIfStale = false,
    checkHasStaleDataFn = (value: unknown) => !isUndefined(value),
    pollingInterval,
  } = options;
  const stateDeps = useRef<StateDeps>({}).current;
  const optionsRef = useUpdatedRef(options);
  const getStatus = useCallback(() => {
    if (isNull(accessor)) return defaultStatus;
    return accessor.getStatus();
  }, [accessor]);
  const status = useSyncExternalStore(
    useCallback(
      listener => {
        if (isNull(accessor)) return noop;
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
    getStatus,
    getStatus
  );

  const [subscribeData, getData] = useMemo(() => {
    if (isNull(accessor)) {
      return [() => noop, noop];
    }

    let memoizedSnapshot = getSnapshot(accessor.getModel());

    return [
      (listener: () => void) => {
        return accessor.subscribeData(() => {
          const snapshot = getSnapshot(accessor.getModel());
          if (stableHash(snapshot) !== stableHash(memoizedSnapshot)) {
            memoizedSnapshot = snapshot;
            listener();
          }
        });
      },
      () => memoizedSnapshot,
    ] as const;
    // We assume the `getSnapshot` is depending on `accessor` so we don't put it in the dependencies array.
  }, [accessor]);

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
    return accessor?.mount({ optionsRef });
  }, [accessor, optionsRef]);

  useEffect(() => {
    if (isNull(accessor)) return;
    if (shouldRevalidate) {
      accessor.revalidate();
    }
  }, [accessor, shouldRevalidate]);

  const revalidate = useCallback(() => {
    accessor?.revalidate();
  }, [accessor]);

  return { stateDeps, status, data, revalidate };
}
