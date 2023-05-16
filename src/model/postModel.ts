import type { Post, PostLayout } from '../types';
import type { Action } from '../lib';
import { Model, createPaginationAdapter } from '../lib';
import { getPostById as getPostByIdRequest, getPostList as getPostListRequest } from '../request';

export const postAdapter = createPaginationAdapter<Post>({});
const initialModel = postAdapter.initialModel;

type PostModel = typeof initialModel;

const getPostById: Action<PostModel, number, Post> = {
  type: 'normal',
  fetchData: async id => {
    const data = await getPostByIdRequest(id);
    return data;
  },
  syncModel: (draft, { data }) => {
    postAdapter.upsertOne(draft, data);
  },
  onError: ({ error, arg }) => {
    console.log(`Error with arg: ${arg}`);
    console.log(error);
  },
  onSuccess: ({ data, arg }) => {
    console.log(`Success with arg: ${arg}`);
    console.log(data);
  },
};

const getPostList: Action<PostModel, { layout: PostLayout }, Post[]> = {
  type: 'infinite',
  fetchData: async ({ layout }, { pageIndex, previousData }) => {
    if (previousData?.length === 0) return null;
    const data = await getPostListRequest({ layout, page: pageIndex });
    return data;
  },
  syncModel: (draft, { data, arg, pageIndex }) => {
    const paginationKey = JSON.stringify(arg);
    postAdapter.updatePagination(draft, { dataArray: data, paginationKey, pageIndex });
  },
};

export const postModel = new Model(initialModel, { getPostById, getPostList });
