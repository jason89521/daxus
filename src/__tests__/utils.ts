import { createModel, createPaginationAdapter } from '../lib';
import type { PostLayout, Post, Func } from './types';

export function sleep(time: number) {
  return new Promise<void>(resolve => setTimeout(resolve, time));
}

export function createPost(id: number, layout: PostLayout = 'classic'): Post {
  return { id, layout, title: 'title' };
}

export function createTestItemModel({
  onSuccess,
  onError,
  fetchData = async (arg: { id: number; prefix?: string }) => {
    return `${arg.prefix ?? 'foo'}/${arg.id}`;
  },
}: { onSuccess?: Func; onError?: Func; fetchData?: Func } = {}) {
  type Model = Record<string, string | undefined>;
  const testItemModel = createModel<Model>({});
  const getTestItem = testItemModel.defineAction<any, any>('normal', {
    fetchData,
    syncModel: (draft, { arg, data }) => {
      draft[arg.id] = data;
    },
    onSuccess,
    onError,
  });

  return { testItemModel, getTestItem };
}

export const postAdapter = createPaginationAdapter<Post>({});

export const postModel = createModel(postAdapter.initialModel);

export const getPostById = postModel.defineAction('normal', {
  fetchData: async (id: number) => {
    return createPost(id);
  },
  syncModel: (model, { data }) => {
    postAdapter.createOne(model, data);
  },
});
