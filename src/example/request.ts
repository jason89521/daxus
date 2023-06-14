import { sleep } from '../lib/utils';
import type { Post, PostLayout } from './types';

export async function getPostById(id: number): Promise<Post> {
  await sleep(1000);
  // if (Math.random() > 0) throw new Error('GET POST ERROR');
  const res = await fetch(`http://localhost:5173/posts/${id}`);

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
  await sleep(500);
  const res = await fetch(`http://localhost:5173/posts?page=${page}&layout=${layout}&limit=5`);

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
