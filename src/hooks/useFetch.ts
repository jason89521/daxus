import { useEffect, useSyncExternalStore } from 'react';
import type { Action } from '../model/types';
import type { ModelAccessor } from '../model/ModelAccessor';

export function useFetch<M, Arg, Data, D = any>(
  accessor: ModelAccessor<M, Arg, Data>,
  getSnapshot: (model: M) => D,
  options: {
    revalidateOnFocus?: boolean;
  } = {}
) {
  const { revalidateOnFocus = true } = options;
  const status = useSyncExternalStore(accessor.subscribe, accessor.getStatusSnapshot);
  const data = useSyncExternalStore(accessor.subscribe, () => {
    return getSnapshot(accessor.getLatestModel());
  });

  useEffect(() => {
    accessor.fetchData();
  }, [accessor]);

  useEffect(() => {
    if (revalidateOnFocus) {
      return accessor.registerRevalidateOnFocus();
    }
  }, [revalidateOnFocus, accessor]);

  return { data };
}
