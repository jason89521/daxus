import { baseUrl } from '@/utils';
import { postAdapter, postModel } from './model';
import type { Post, PostLayout } from '@/type';

export const getPost = postModel.defineAccessor({
  name: 'getPost',
  async fetchData(postId: string) {
    const post: Post = await (await fetch(`${baseUrl}/post/${postId}`)).json();

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
  name: 'listPost',
  async fetchData(arg, { pageIndex }) {
    const key = getPostPaginationKey(arg);
    const posts: Post[] = await (
      await fetch(`${baseUrl}/api/post?page=${pageIndex}&${key}`, { cache: 'no-store' })
    ).json();

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
