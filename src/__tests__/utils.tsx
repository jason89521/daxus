import type { ReactNode } from 'react';
import { AccessorOptionsProvider, createModel, createPaginationAdapter } from '../lib';
import type { PostModelControl } from './types';
import type { Post, PostLayout } from '../types';
import { render } from '@testing-library/react';
import type { AccessorOptions } from '../lib/hooks/types';

export function sleep(time: number) {
  return new Promise<void>(resolve => setTimeout(resolve, time));
}

export function createPost(id: number, layout: PostLayout = 'classic'): Post {
  return { id: `${id}`, layout, title: `title${id}` };
}

export function createPostModel(control: PostModelControl) {
  const postAdapter = createPaginationAdapter<Post>({});
  const postModel = createModel(postAdapter.initialState);
  const getPostById = postModel.defineNormalAccessor({
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

  const getPostList = postModel.defineInfiniteAccessor<void, Post[]>({
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
