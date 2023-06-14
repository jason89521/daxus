import type { Post, PostLayout } from '../types';
import axios from 'axios';

const PORT = 5173;

export async function getPostById(id: number): Promise<Post> {
  const res = await axios.get(`http://localhost:${PORT}/posts/${id}`);

  return res.data;
}

export async function getPostList({
  layout,
  page,
}: {
  layout: PostLayout;
  page: number;
}): Promise<Post[]> {
  const res = await axios.get(
    `http://localhost:${PORT}/posts?page=${page}&layout=${layout}&limit=5`
  );

  return res.data;
}

export async function updatePostLayoutById(id: number, layout: PostLayout): Promise<Post> {
  const res = await axios.patch(`http://localhost:${PORT}/posts/${id}`, {
    body: JSON.stringify({ layout }),
  });

  return res.data;
}
