import { useCallback, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import type { Accessor, Status } from '../model';
import { isUndefined, noop, objectKeys, stableHash } from '../utils';
import type { AccessorOptions, RequiredAccessorOptions, UseAccessorReturn } from './types';
import { useUpdatedRef } from './useUpdatedRef';
import { isNull } from '../utils/isNull';
import { accessorOptionsContext } from '../contexts';

type StateDeps = Partial<Record<keyof Status | 'data', boolean>>;

const defaultStatus: Status = { isFetching: false, error: null };

/**
 * useAccessor hook provides a way to access and manage data fetched by an accessor.
 * @param accessor The accessor generated from an accessor creator function. It can be `null`. This may be useful when you want conditional fetching.
 * @param getSnapshot A function that accepts the state of the `accessor`'s model and returns the desired data.
 * @param options Additional options for controlling the behavior of the accessor.
 */
export function useAccessor<S, D, E = unknown>(
  accessor: Accessor<S, any, E>,
  getSnapshot: (state: S) => D,
  options?: AccessorOptions<D>
): UseAccessorReturn<D, E>;
export function useAccessor<S, D, E = unknown>(
  accessor: Accessor<S, any, E> | null,
  getSnapshot: (state: S) => D,
  options?: AccessorOptions<D>
): UseAccessorReturn<D | undefined, E>;
export function useAccessor<S, D, E = unknown>(
  accessor: Accessor<S, any, E> | null,
  getSnapshot: (state: S) => D,
  options: AccessorOptions<D> = {}
): UseAccessorReturn<D | undefined, E> {
  const defaultOptions = useContext(accessorOptionsContext);
  const requiredOptions = { ...defaultOptions, ...options };
  const { revalidateOnMount, revalidateIfStale, checkHasData, pollingInterval } = requiredOptions;
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
      return [() => noop, noop as () => undefined];
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
  const hasData = !isUndefined(data) ? checkHasData(data) : false;
  const revalidateWhenAccessorChange = (() => {
    // Always revalidate when this hook is mounted.
    if (revalidateOnMount) return true;
    // If the data, for which the accessor is responsible for fetching, is stale, then we should revalidate.
    if (revalidateIfStale && accessor?.getIsStale()) return true;
    // If there is no data, we should fetch the data.
    if (!hasData) return true;
    // This condition is useful when `pollingInterval` changes.
    if ((pollingInterval ?? 0) > 0) return true;

    return false;
  })();

  useEffect(() => {
    return accessor?.mount({ optionsRef });
  }, [accessor, optionsRef]);

  useEffect(() => {
    if (revalidateWhenAccessorChange) {
      accessor?.revalidate();
    }
  }, [accessor, revalidateWhenAccessorChange]);

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
