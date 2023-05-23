import type { PostLayout, Post } from './types';

export function createPost(id: number, layout: PostLayout = 'classic'): Post {
  return { id, layout, title: 'title' };
}
