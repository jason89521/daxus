import { getPostById } from '../model';
import { useAccessor } from '../../lib';
import type { FetchOptions } from '../../lib/hooks/types';

interface Props extends FetchOptions {
  id: number;
}

export function usePost({ id, ...options }: Props) {
  const { data } = useAccessor(
    getPostById(id),
    state => {
      return state.entityRecord[id];
    },
    { ...options }
  );

  return { post: data };
}
