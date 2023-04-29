import type { Post } from './types';

export async function getPostById(id: number): Promise<Post> {
  const res = await fetch(`http://localhost:3000/posts/${id}`);
  const data = await res.json();
  return data;
}

export async function getPostList({
  layout,
  page,
}: {
  layout: 'classic' | 'image';
  page: number;
}): Promise<Post[]> {
  const res = await fetch(
    `http://localhost:3000/posts?_page=${page + 1}&layout=${layout}&_limit=5`
  );
  const data = await res.json();

  return data;
}

export async function updatePostLayoutById(id: number, layout: 'classic' | 'image'): Promise<Post> {
  const res = await fetch(`http://localhost:3000/posts/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify({ layout }),
  });
  const data = await res.json();

  return data;
}
