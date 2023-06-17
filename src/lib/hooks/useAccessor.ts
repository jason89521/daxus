import { useCallback, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import type { InfiniteAccessor, NormalAccessor, Status } from '../model';
import { isUndefined, noop, objectKeys, stableHash } from '../utils';
import type { AccessorOptions, RequiredAccessorOptions } from './types';
import { useUpdatedRef } from './useUpdatedRef';
import { isNull } from '../utils/isNull';
import { accessorOptionsContext } from '../contexts';

type StateDeps = Partial<Record<keyof Status | 'data', boolean>>;
type Accessor<S, E> = NormalAccessor<S, any, any, E> | InfiniteAccessor<S, any, any, E>;
type ReturnValue<D, E> = {
  readonly isFetching: boolean;
  readonly error: E;
  readonly data: D;
};

const defaultStatus: Status = { isFetching: false, error: null };

export function useAccessor<S, D, E = unknown>(
  accessor: Accessor<S, E>,
  getSnapshot: (state: S) => D,
  options?: AccessorOptions<D>
): ReturnValue<D, E>;
export function useAccessor<S, D, E = unknown>(
  accessor: Accessor<S, E> | null,
  getSnapshot: (state: S) => D,
  options?: AccessorOptions<D>
): ReturnValue<D | undefined, E>;
export function useAccessor<S, D, E = unknown>(
  accessor: Accessor<S, E> | null,
  getSnapshot: (state: S) => D,
  options: AccessorOptions<D> = {}
): ReturnValue<D, E> {
  const defaultOptions = useContext(accessorOptionsContext);
  const requiredOptions = { ...defaultOptions, ...options };
  const { revalidateOnMount, revalidateIfStale, checkHasStaleData, pollingInterval } =
    requiredOptions;
  const stateDeps = useRef<StateDeps>({}).current;
  const optionsRef = useUpdatedRef<RequiredAccessorOptions<D>>(requiredOptions);
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
            if (key === 'data') continue;
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

    let memoizedSnapshot = getSnapshot(accessor.getState());

    return [
      (listener: () => void) => {
        return accessor.subscribeData(() => {
          if (!stateDeps.data) return;
          const snapshot = getSnapshot(accessor.getState());
          if (stableHash(snapshot) !== stableHash(memoizedSnapshot)) {
            memoizedSnapshot = snapshot;
            listener();
          }
        });
      },
      () => memoizedSnapshot,
    ] as const;
    // We assume the `getSnapshot` is depending on `accessor` so we don't put it in the dependencies array.
  }, [accessor, stateDeps]);

  const data = useSyncExternalStore(subscribeData, getData, getData);
  const hasStaleData = checkHasStaleData(data);
  const shouldRevalidate = (() => {
    // Always revalidate when this hook is mounted.
    if (revalidateOnMount) return true;
    if (revalidateIfStale && hasStaleData) return true;
    // If there is no stale data, we should fetch the data.
    if (!hasStaleData) return true;
    // This condition is useful when `pollingInterval` changes.
    if ((pollingInterval ?? 0) > 0) return true;

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

  return {
    get data() {
      stateDeps.data = true;
      return data;
    },
    get isFetching() {
      stateDeps.isFetching = true;
      return status.isFetching;
    },
    get error() {
      stateDeps.error = true;
      return status.error as E;
    },
  };
}
