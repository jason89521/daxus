import { useEffect, useState } from 'react';
import type { Post } from '../types';

interface Props {
  id: number;
}

const map = new Map<number, { isFetching: boolean }>();

export function usePost({ id }: Props) {
  const [post, setPost] = useState<Post | null>(null);

  useEffect(() => {
    const cachedValue = map.get(id);
    if (cachedValue) {
      if (cachedValue.isFetching) return;
    }

    map.set(id, { isFetching: true });
    fetch(`http://localhost:3000/posts/${id}`)
      .then(res => res.json())
      .then(data => {
        map.set(id, { isFetching: false });
        setPost(data);
      });
  }, [id]);

  return { post };
}
