import { postAdapter, postModel } from './model';
import type { Post, PostLayout } from '@/type';

export const getPost = postModel.defineAccessor({
  async fetchData(postId: string) {
    const res = await fetch(`/api/post/${postId}`);
    if (!res.ok) throw new Error(`Post with id: ${postId} doesn't exist`);
    const post: Post = await res.json();

    return post;
  },
  syncState(draft, { data }) {
    postAdapter.upsertOne(draft, data);
  },
});

interface PaginationOptions {
  layout?: PostLayout;
  forumId?: string;
}

export function getPostPaginationKey({ layout, forumId }: PaginationOptions) {
  if (layout && forumId) return `layout=${layout}&forumId=${forumId}`;
  if (layout) return `layout=${layout}`;
  if (forumId) return `forumId=${forumId}`;
  return '';
}

export const listPost = postModel.defineInfiniteAccessor<Post[], PaginationOptions>({
  async fetchData(arg, { pageIndex }) {
    const key = getPostPaginationKey(arg);
    const res = await fetch(`/api/post?page=${pageIndex}&${key}`);
    if (!res.ok) throw new Error(`Post list not found`);
    const posts: Post[] = await res.json();

    return posts;
  },
  syncState(draft, { arg, data, pageIndex }) {
    const key = getPostPaginationKey(arg);
    if (pageIndex === 0) {
      postAdapter.replacePagination(draft, key, data);
    } else {
      postAdapter.appendPagination(draft, key, data);
    }
  },
});
