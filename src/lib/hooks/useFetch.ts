import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import type { Cache, NormalModelAccessor } from '../model';
import { objectKeys, stableHash } from '../utils';

type StateDeps<D> = Partial<Record<keyof Cache<D>, boolean>>;

export function useFetch<M, Arg, RD, D = any>(
  accessor: NormalModelAccessor<M, Arg, RD>,
  getSnapshot: (model: M) => D,
  options: {
    revalidateOnFocus?: boolean;
    revalidateOnReconnect?: boolean;
  } = {}
) {
  const { revalidateOnFocus = true, revalidateOnReconnect = true } = options;
  const stateDeps = useRef<StateDeps<RD>>({}).current;
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
    () => accessor.getCache()
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

  useEffect(() => {
    accessor.fetch();
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
      stateDeps.data = true;
      return data;
    },
    get isFetching() {
      stateDeps.isFetching = true;
      return isFetching;
    },
  };
}
