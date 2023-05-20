import type { NormalModelAccessor } from '../model';
import { useModelAccessor } from './useModelAccessor';
import type { FetchOptions } from './types';

export function useFetch<M, Arg, RD, D = any>(
  accessor: NormalModelAccessor<M, Arg, RD>,
  getSnapshot: (model: M) => D,
  options: FetchOptions = {}
) {
  const { stateDeps, status, data } = useModelAccessor(accessor, getSnapshot, options);
  const { isFetching } = status;

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
