import type { Post } from '../types';
import { Model, createInfiniteActionIdentifier, createNormalActionIdentifier } from '../lib';
import { getPostById as getPostByIdRequest, getPostList as getPostListRequest } from '../request';

type PostModel = {
  index: Record<number, Post | undefined>;
  pagination: Record<string, Post[] | undefined>;
};

const getPostById = createNormalActionIdentifier<PostModel, number, Post>({
  fetchData: async id => {
    const data = await getPostByIdRequest(id);

    return data;
  },
  syncModel: (draft, { remoteData, arg }) => {
    draft.index[arg] = remoteData;
  },
});

const getPostList = createInfiniteActionIdentifier<
  PostModel,
  { layout: 'classic' | 'image' },
  Post[]
>({
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
});

const initialModel: PostModel = { index: {}, pagination: {} };

export const postModel = new Model(initialModel, { getPostById, getPostList });
