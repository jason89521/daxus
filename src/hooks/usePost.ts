import { postModel } from '../model';
import { useFetch } from './useFetch';

interface Props {
  id: number;
}

export function usePost({ id }: Props) {
  const { data } = useFetch(postModel.actions.getPostById(id), model => {
    return model.index[id];
  });

  return { post: data };
}
