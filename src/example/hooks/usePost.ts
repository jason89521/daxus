import { getPostById } from '../model';
import { useFetch } from '../../lib';

interface Props {
  id: number;
}

export function usePost({ id }: Props) {
  const { data } = useFetch(getPostById(id), model => {
    return model.data[id];
  });

  return { post: data };
}
