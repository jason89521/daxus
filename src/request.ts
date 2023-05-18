import type { Post, PostLayout } from './types';

export async function getPostById(id: number): Promise<Post> {
  const res = await fetch(`http://localhost:3000/posts/${id}`);

  if (Math.random() > 0) {
    throw new Error(`get post error with id: ${id}`);
  }
  const data = await res.json();
  return data;
}

export async function getPostList({
  layout,
  page,
}: {
  layout: PostLayout;
  page: number;
}): Promise<Post[]> {
  const res = await fetch(
    `http://localhost:3000/posts?_page=${page + 1}&layout=${layout}&_limit=5`
  );
  const data = await res.json();

  return data;
}

export async function updatePostLayoutById(id: number, layout: PostLayout): Promise<Post> {
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
