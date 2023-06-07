import { getPostById } from '../model';
import { useFetch } from '../../lib';
import type { FetchOptions } from '../../lib/hooks/types';

interface Props extends FetchOptions {
  id: number;
}

export function usePost({ id, ...options }: Props) {
  const { data } = useFetch(
    getPostById(id),
    model => {
      return model.entityRecord[id];
    },
    { ...options }
  );

  return { post: data };
}
