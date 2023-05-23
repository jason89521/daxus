import { createModel, createPaginationAdapter } from '../lib';
import type { PostLayout, Post } from './types';

export function sleep(time: number) {
  return new Promise<void>(resolve => setTimeout(resolve, time));
}

export function createPost(id: number, layout: PostLayout = 'classic'): Post {
  return { id, layout, title: 'title' };
}

export function createTestItemModel() {
  const testItemModel = createModel<Record<string, string | undefined>>({});
  const getTestItem = testItemModel.defineAction('normal', {
    fetchData: async (arg: { id: number; prefix?: string }) => {
      return `${arg.prefix ?? 'foo'}/${arg.id}`;
    },
    syncModel: (draft, { arg, data }) => {
      draft[arg.id] = data;
    },
  });

  return { testItemModel, getTestItem };
}

export const postAdapter = createPaginationAdapter({});

export const postModel = createModel(postAdapter.initialModel);

export const getPostById = postModel.defineAction('normal', {
  fetchData: async (id: number) => {
    return createPost(id);
  },
  syncModel: (model, { data }) => {
    postAdapter.createOne(model, data);
  },
});
