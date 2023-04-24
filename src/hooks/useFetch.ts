import { useEffect, useSyncExternalStore } from 'react';
import type { FetchObject, CacheData } from '../model';

export function useFetch<M, FO extends FetchObject<M>, D = any>(
  cacheData: CacheData<M, FO>,
  getSnapshot: (model: M) => D,
  options: {
    validateOnFocus?: boolean;
  } = {}
) {
  const { validateOnFocus = true } = options;
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
    if (!validateOnFocus) return;
    const handleFocus = (e: FocusEvent) => {
      console.log('DEBUG onFocus');
      cacheData.validate();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [validateOnFocus, cacheData]);

  return { data, hasFetched, isFetching };
}
