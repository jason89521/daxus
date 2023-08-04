import type { ReactNode } from 'react';
import { AccessorOptionsProvider, createDatabase, createPaginationAdapter } from '../index.js';
import type { PostModelControl } from './types.js';
import type { Post, PostLayout } from '../types.js';
import { render } from '@testing-library/react';
import type { AccessorOptions } from '../index.js';

export function sleep(time: number) {
  return new Promise<void>(resolve => setTimeout(resolve, time));
}

export function createPost(id: number, layout: PostLayout = 'classic'): Post {
  return { id: `${id}`, layout, title: `title${id}` };
}

export function createPostModel(control: PostModelControl) {
  const db = createDatabase();
  const postAdapter = createPaginationAdapter<Post>({});
  const postModel = db.createModel({ name: 'post', initialState: postAdapter.getInitialState() });
  const getPostById = postModel.defineAccessor({
    name: 'getPostById',
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
    syncState: (draft, { data }) => {
      postAdapter.createOne(draft, data);
    },
    onSuccess: info => {
      control.onSuccessMock?.(info);
    },
    onError: info => {
      control.onErrorMock?.(info);
    },
  });

  const getPostList = postModel.defineInfiniteAccessor<Post[]>({
    name: 'getPostList',
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
    syncState(draft, { pageIndex, data }) {
      const paginationKey = '';
      if (pageIndex === 0) {
        postAdapter.replacePagination(draft, paginationKey, data);
      } else {
        postAdapter.appendPagination(draft, paginationKey, data);
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

export function createControl(initialControl: PostModelControl) {
  return initialControl;
}

export function renderWithOptionsProvider(
  element: ReactNode,
  { accessorOptions = {} }: { accessorOptions?: AccessorOptions } = {}
) {
  return render(
    <AccessorOptionsProvider value={accessorOptions}>{element}</AccessorOptionsProvider>
  );
}
