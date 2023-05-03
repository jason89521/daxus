import { useCallback, useEffect, useSyncExternalStore } from 'react';
import type { ModelAccessor } from '../model';
import { stableHash } from '../utils';

export function useFetch<M, Arg, RD, D = any>(
  accessor: ModelAccessor<M, Arg, RD>,
  getSnapshot: (model: M) => D,
  options: {
    revalidateOnFocus?: boolean;
    revalidateOnReconnect?: boolean;
  } = {}
) {
  const { revalidateOnFocus = true, revalidateOnReconnect = true } = options;
  // const { isFetching } = useSyncExternalStore(accessor.subscribe, accessor.getStatusSnapshot);

  const data = useSyncExternalStore(
    useCallback(
      storeListener => {
        return accessor.subscribeData((current, prev) => {
          if (stableHash(current) !== stableHash(prev)) storeListener();
        });
      },
      [accessor]
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
    data,
  };
}
