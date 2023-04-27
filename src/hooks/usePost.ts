import { postModel } from '../model';
import { useFetch } from './useFetch';

interface Props {
  id: number;
}

export function usePost({ id }: Props) {
  const { data } = useFetch(
    postModel.accessorGetters.getPostById(id),
    model => {
      return model.index[id];
    },
    { revalidateOnFocus: false }
  );

  return { post: data };
}
