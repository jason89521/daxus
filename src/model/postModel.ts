import type { Post } from '../types';
import { Model } from './createModel';
import type { FetchObject } from './createModel';
import { getPostById as getPostByIdRequest } from '../request';

type PostModel = { index: Record<number, Post | undefined> };

const getPostById: FetchObject<PostModel, number> = {
  fetchData: async (model, id) => {
    const data = await getPostByIdRequest(id);

    model.index[id] = data;
  },
};

const initialModel: PostModel = { index: {} };

export const postModel = new Model(initialModel, { getPostById });
