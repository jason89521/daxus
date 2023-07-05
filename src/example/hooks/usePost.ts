import { getPostById } from '../model/index.js';
import { useAccessor } from '../../lib/index.js';
import type { AccessorOptions } from '../../lib/hooks/types.js';

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
