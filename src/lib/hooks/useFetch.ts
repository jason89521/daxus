import { useEffect } from 'react';
import type { NormalModelAccessor } from '../model';
import { useModelAccessor } from './useModelAccessor';
import type { FetchOption } from './types';

export function useFetch<M, Arg, RD, D = any>(
  accessor: NormalModelAccessor<M, Arg, RD>,
  getSnapshot: (model: M) => D,
  options: FetchOption = {}
) {
  const { revalidateOnFocus = true, revalidateOnReconnect = true, retryCount = 5 } = options;
  const { stateDeps, status, data } = useModelAccessor(accessor, getSnapshot);
  const { isFetching } = status;

  useEffect(() => {
    accessor.setRetryCount(retryCount);
  }, [accessor, retryCount]);

  useEffect(() => {
    accessor.fetch();
  }, [accessor, retryCount]);

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
      return data;
    },
    get isFetching() {
      stateDeps.isFetching = true;
      return isFetching;
    },
  };
}
