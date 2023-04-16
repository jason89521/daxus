import { useEffect, useSyncExternalStore } from 'react';
import type { FetchObject, CacheData } from '../model';

export function useFetch<M, FO extends FetchObject<M>, D = any>(
  cacheData: CacheData<M, FO>,
  getSnapshot: (model: M) => D
) {
  const { hasFetched } = useSyncExternalStore(cacheData.subscribe, cacheData.getInfoSnapshot);
  const data = useSyncExternalStore(cacheData.subscribe, () => {
    return getSnapshot(cacheData.getLatestModel());
  });

  useEffect(() => {
    if (hasFetched) return;
    cacheData.fetchData();
  }, [cacheData, hasFetched]);

  return { data };
}
