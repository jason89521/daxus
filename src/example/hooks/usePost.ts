import { getPostById } from '../model';
import { useAccessor } from '../../lib';
import type { AccessorOptions } from '../../lib/hooks/types';

interface Props extends AccessorOptions {
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
