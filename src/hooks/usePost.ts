import { postModel } from '../model';
import { useFetch } from '../lib';

interface Props {
  id: number;
}

export function usePost({ id }: Props) {
  const { data } = useFetch(
    postModel.accessorGetters.getPostById(id),
    model => {
      return model.data[id];
    },
    { revalidateOnFocus: false }
  );

  return { post: data };
}
