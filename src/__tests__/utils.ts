import { createModel, createPaginationAdapter } from '../lib';
import type { PostLayout, Post, Func, PostModelControl } from './types';

export function sleep(time: number) {
  return new Promise<void>(resolve => setTimeout(resolve, time));
}

export function createPost(id: number, layout: PostLayout = 'classic'): Post {
  return { id, layout, title: `title${id}` };
}

export function createTestItemModel({
  onSuccess,
  onError,
  fetchData = async (arg: number) => {
    return `${arg}`;
  },
}: { onSuccess?: Func; onError?: Func; fetchData?: Func } = {}) {
  type Model = Record<string, string | undefined>;
  const testItemModel = createModel<Model>({});
  const getTestItem = testItemModel.defineAction<number, any>('normal', {
    fetchData,
    syncModel: (draft, { arg, data }) => {
      draft[arg] = data;
    },
    onSuccess,
    onError,
  });

  return { testItemModel, getTestItem };
}

export function createPostModel(control: PostModelControl) {
  const postAdapter = createPaginationAdapter<Post>({});
  const postModel = createModel(postAdapter.initialModel);
  const getPostById = postModel.defineAction('normal', {
    fetchData: async (id: number) => {
      control.fetchDataMock?.();

      if (control.fetchDataError) {
        throw control.fetchDataError;
      }

      if (control.sleepTime) {
        await sleep(control.sleepTime);
      }

      const post = createPost(id);
      if (control.titlePrefix) {
        post.title = `${control.titlePrefix} ${post.title}`;
      }
      return post;
    },
    syncModel: (model, { data }) => {
      postAdapter.createOne(model, data);
    },
    onSuccess: info => {
      control.onSuccessMock?.(info);
    },
    onError: info => {
      control.onErrorMock?.(info);
    },
  });

  const getPostList = postModel.defineAction<void, Post[]>('infinite', {
    async fetchData(_, { pageIndex }) {
      control.fetchDataMock?.();

      if (control.fetchDataError) {
        throw control.fetchDataError;
      }

      if (control.sleepTime) {
        await sleep(control.sleepTime);
      }
      const post = createPost(pageIndex);
      if (control.titlePrefix) {
        post.title = `${control.titlePrefix} ${post.title}`;
      }
      return [post];
    },
    syncModel(model, { pageIndex, data }) {
      const paginationKey = '';
      if (pageIndex === 0) {
        postAdapter.replacePagination(model, paginationKey, data);
      } else {
        postAdapter.appendPagination(model, paginationKey, data);
      }
    },
    onSuccess: info => {
      control.onSuccessMock?.(info);
    },
    onError: info => {
      control.onErrorMock?.(info);
    },
  });

  return { postAdapter, postModel, getPostById, getPostList };
}

export function getPostModelControl(initialControl: PostModelControl) {
  return initialControl;
}
