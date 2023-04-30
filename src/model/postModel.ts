import type { Post } from '../types';
import type { Action } from '../lib';
import { Model } from '../lib';
import { getPostById as getPostByIdRequest, getPostList as getPostListRequest } from '../request';

type PostModel = {
  index: Record<number, Post | undefined>;
  pagination: Record<string, Post[] | undefined>;
};

const getPostById: Action<PostModel, number, Post> = {
  type: 'normal',
  fetchData: async id => {
    const data = await getPostByIdRequest(id);

    return data;
  },
  syncModel: (draft, { remoteData, arg }) => {
    draft.index[arg] = remoteData;
  },
};

const getPostList: Action<PostModel, { layout: 'classic' | 'image' }, Post[]> = {
  type: 'infinite',
  fetchData: async ({ layout }, { pageIndex }) => {
    const data = await getPostListRequest({ layout, page: pageIndex });

    return data;
  },
  syncModel: (draft, { remoteData, arg, pageIndex }) => {
    const paginationKey = JSON.stringify(arg);
    if (pageIndex === 0) {
      draft.pagination[paginationKey] = remoteData;
      return;
    }
    draft.pagination[paginationKey]?.push(...remoteData);
  },
};

const initialModel: PostModel = { index: {}, pagination: {} };

export const postModel = new Model(initialModel, { getPostById, getPostList });
