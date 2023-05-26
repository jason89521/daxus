import { getPostById } from '../model';
import { useFetch } from '../../lib';

interface Props {
  id: number;
  revalidateOnFocus?: boolean;
}

export function usePost({ id, revalidateOnFocus }: Props) {
  const { data } = useFetch(
    getPostById(id),
    model => {
      return model.data[id];
    },
    { revalidateOnFocus }
  );

  return { post: data };
}
