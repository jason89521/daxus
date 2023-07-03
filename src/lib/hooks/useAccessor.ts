import { useCallback, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import type { Accessor, InfiniteAccessor, NormalAccessor, Status } from '../model';
import { isUndefined, noop, objectKeys, stableHash, isNull } from '../utils';
import type { AccessorOptions, RequiredAccessorOptions, UseAccessorReturn } from './types';
import { useUpdatedRef } from './useUpdatedRef';
import { accessorOptionsContext, useServerStateKeyContext } from '../contexts';

type StateDeps = Partial<Record<keyof Status | 'data', boolean>>;

const defaultStatus = { isFetching: false, error: null } satisfies Status;

/**
 * `useAccessor` hook provides a way to access and manage data fetched by an accessor.
 * @param accessor The accessor generated from an accessor creator function. It can be `null`. This may be useful when you want conditional fetching.
 * @param getSnapshot A function that accepts the state of the `accessor`'s model and returns the desired data.
 * @param options Additional options for controlling the behavior of the accessor.
 */
export function useAccessor<S, Arg, RD, SS, E = unknown>(
  accessor: NormalAccessor<S, Arg, RD, E>,
  getSnapshot: (state: S) => SS,
  options?: AccessorOptions<SS>
): UseAccessorReturn<SS, E, NormalAccessor<S, Arg, RD, E>>;
export function useAccessor<S, Arg, RD, SS, E = unknown>(
  accessor: NormalAccessor<S, Arg, RD, E> | null,
  getSnapshot: (state: S) => SS,
  options?: AccessorOptions<SS>
): UseAccessorReturn<SS | undefined, E, NormalAccessor<S, Arg, RD, E> | null>;
export function useAccessor<S, Arg, RD, SS, E = unknown>(
  accessor: InfiniteAccessor<S, Arg, RD, E>,
  getSnapshot: (state: S) => SS,
  options?: AccessorOptions<SS>
): UseAccessorReturn<SS, E, InfiniteAccessor<S, Arg, RD, E>>;
export function useAccessor<S, Arg, RD, SS, E = unknown>(
  accessor: InfiniteAccessor<S, Arg, RD, E> | null,
  getSnapshot: (state: S) => SS,
  options?: AccessorOptions<SS>
): UseAccessorReturn<SS | undefined, E, InfiniteAccessor<S, Arg, RD, E> | null>;
export function useAccessor<S, SS, E = unknown>(
  accessor: Accessor<S, any, E> | null,
  getSnapshot: (state: S) => SS,
  options: AccessorOptions<SS> = {}
): UseAccessorReturn<SS | undefined, E, Accessor<S, any, E> | null> {
  const serverStateKey = useServerStateKeyContext();
  const defaultOptions = useContext(accessorOptionsContext);
  const requiredOptions = { ...defaultOptions, ...options };
  const { revalidateOnMount, revalidateIfStale, checkHasData, pollingInterval, keepPreviousData } =
    requiredOptions;
  const stateDeps = useRef<StateDeps>({}).current;
  const optionsRef = useUpdatedRef<RequiredAccessorOptions<SS>>(requiredOptions);
  const getStatus = useCallback(() => {
    return accessor?.getStatus() ?? defaultStatus;
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

    const getState = () => {
      return accessor.getState(serverStateKey);
    };

    let memoizedSnapshot = getSnapshot(getState());

    return [
      (listener: () => void) => {
        return accessor.subscribeData(() => {
          if (!stateDeps.data) return;
          const snapshot = getSnapshot(getState());
          if (stableHash(snapshot) !== stableHash(memoizedSnapshot)) {
            memoizedSnapshot = snapshot;
            listener();
          }
        });
      },
      () => memoizedSnapshot,
    ] as const;
    // We assume the `getSnapshot` is depending on `accessor` so we don't put it in the dependencies array.
  }, [accessor, stateDeps, serverStateKey]);

  const data = useSyncExternalStore(subscribeData, getData, getData);
  const hasData = !isUndefined(data) ? checkHasData(data) : false;
  const deferredDataRef = useRef(data);
  const revalidateWhenAccessorChange = (() => {
    // Always revalidate when this hook is mounted.
    if (revalidateOnMount) return true;
    // If the accessor is stale, then we should revalidate.
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

  useEffect(() => {
    if (hasData) {
      deferredDataRef.current = data;
    }
  });

  return {
    get data() {
      stateDeps.data = true;
      if (keepPreviousData) {
        return hasData ? data : deferredDataRef.current;
      }

      return data;
    },
    get isFetching() {
      stateDeps.isFetching = true;
      return status.isFetching;
    },
    get isLoading() {
      stateDeps.isFetching = true;
      return status.isFetching && !hasData;
    },
    get error() {
      stateDeps.error = true;
      return status.error;
    },
    accessor,
  };
}
