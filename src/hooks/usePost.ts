import { useEffect } from 'react';
import { postModel } from '../model';
import { useFetch } from './useFetch';

interface Props {
  id: number;
}

export function usePost({ id }: Props) {
  const { data } = useFetch(postModel.actions.getPostById(id), model => model.index[id]);
  useEffect(() => {
    console.log('data: ', data);
  }, [data]);

  return { post: data };
}
