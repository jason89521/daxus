import type { Post, PostLayout } from '../types';
import { createModel } from '../lib';
import { createPaginationAdapter } from '../lib';
import { getPostById as getPostByIdRequest, getPostList as getPostListRequest } from '../request';

export const postAdapter = createPaginationAdapter<Post>({});
const initialModel = postAdapter.initialModel;

export const postModel = createModel(initialModel);

export const getPostById = postModel.defineNormalAction({
  fetchData: async (id: number) => {
    const data = await getPostByIdRequest(id);
    return data;
  },
  syncModel: (draft, { data }) => {
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

export const getPostList = postModel.defineInfiniteAction<{ layout: PostLayout }, Post[]>({
  fetchData: async ({ layout }, { pageIndex, previousData }) => {
    if (previousData?.length === 0) return null;
    const data = await getPostListRequest({ layout, page: pageIndex });
    return data;
  },
  syncModel: (draft, { data, arg, pageIndex }) => {
    const paginationKey = JSON.stringify(arg);
    postAdapter.updatePagination(draft, { dataArray: data, paginationKey, pageIndex });
  },
  onError: ({ error, arg }) => {
    console.log(`Error on getPostList with arg: ${arg}`);
    console.log(error);
  },
  onSuccess: ({ data, arg }) => {
    console.log(`Success on getPostList with arg: ${arg}`);
    console.log(data);
  },
});
