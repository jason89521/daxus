import { useEffect, useSyncExternalStore } from 'react';
import type { FetchObject, CacheData } from '../model';

export function useFetch<M, FO extends FetchObject<M>, D = any>(
  cacheData: CacheData<M, FO>,
  getSnapshot: (model: M) => D,
  options: {
    revalidateOnFocus?: boolean;
  } = {}
) {
  const { revalidateOnFocus = true } = options;
  const { hasFetched, isFetching } = useSyncExternalStore(
    cacheData.subscribe,
    cacheData.getStatusSnapshot
  );
  const data = useSyncExternalStore(cacheData.subscribe, () => {
    return getSnapshot(cacheData.getLatestModel());
  });

  useEffect(() => {
    cacheData.fetchData();
  }, [cacheData]);

  useEffect(() => {
    if (revalidateOnFocus) {
      return cacheData.registerRevalidateOnFocus();
    }
  }, [revalidateOnFocus, cacheData]);

  return { data, hasFetched, isFetching };
}
