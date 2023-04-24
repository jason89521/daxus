import type { Post } from '../types';
import { Model } from './createModel';
import type { FetchObject } from './createModel';
import { getPostById as getPostByIdRequest } from '../request';

type PostModel = { index: Record<number, Post | undefined> };

const getPostById: FetchObject<PostModel, number, Post> = {
  fetchData: async id => {
    const data = await getPostByIdRequest(id);

    return data;
  },
  syncModel: (draft, { remoteData, arg }) => {
    draft.index[arg] = remoteData;
  },
  validateModel: (draft, { remoteData, arg }) => {
    draft.index[arg] = remoteData;
  },
};

const initialModel: PostModel = { index: {} };

export const postModel = new Model(initialModel, { getPostById });
