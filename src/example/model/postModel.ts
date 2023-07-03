import type { Post, PostLayout } from '../../types';
import { createModel } from '../../lib';
import { createPaginationAdapter } from '../../lib';
import { getPostById as getPostByIdRequest, getPostList as getPostListRequest } from '../request';

export const postAdapter = createPaginationAdapter<Post>({});

export const postModel = createModel(postAdapter.initialState);

export const getPostById = postModel.defineNormalAccessor({
  fetchData: async (id: number) => {
    const data = await getPostByIdRequest(id);
    return data;
  },
  syncState: (draft, { data }) => {
    postAdapter.upsertOne(draft, data);
  },
  onError: ({ error, arg }) => {
    console.log(`Error on getPostById with arg: ${arg}`);
    console.log(error);
  },
  onSuccess: ({ data, arg }) => {
    console.log(`Success on getPostById with arg: ${arg}`);
    console.log(data);
  },
});

export const getPostList = postModel.defineInfiniteAccessor<{ layout: PostLayout }, Post[]>({
  fetchData: async ({ layout }, { pageIndex, previousData }) => {
    if (previousData?.length === 0) return null;
    const data = await getPostListRequest({ layout, page: pageIndex });
    return data;
  },
  syncState: (draft, { data, arg, pageIndex }) => {
    const paginationKey = JSON.stringify(arg);
    if (pageIndex === 0) {
      postAdapter.replacePagination(draft, paginationKey, data);
    } else {
      postAdapter.appendPagination(draft, paginationKey, data);
    }
  },
  onError: ({ error, arg }) => {
    console.log(`Error on getPostList with arg:`, arg);
    console.log(error);
  },
  onSuccess: ({ data, arg }) => {
    console.log(`Success on getPostList with arg:`, arg);
    console.log(data);
  },
});
