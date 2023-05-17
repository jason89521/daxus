import { useEffect } from 'react';
import type { NormalModelAccessor } from '../model';
import { useModelAccessor } from './useModelAccessor';

export function useFetch<M, Arg, RD, D = any>(
  accessor: NormalModelAccessor<M, Arg, RD>,
  getSnapshot: (model: M) => D,
  options: {
    revalidateOnFocus?: boolean;
    revalidateOnReconnect?: boolean;
  } = {}
) {
  const { revalidateOnFocus = true, revalidateOnReconnect = true } = options;
  const { stateDeps, status, data } = useModelAccessor(accessor, getSnapshot);
  const { isFetching } = status;

  useEffect(() => {
    accessor.revalidate();
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
      return data;
    },
    get isFetching() {
      stateDeps.isFetching = true;
      return isFetching;
    },
  };
}
