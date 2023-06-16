import type { ReactNode } from 'react';
import { StrictMode } from 'react';
import { createModel, createPaginationAdapter } from '../lib';
import type { PostModelControl } from './types';
import type { Post, PostLayout } from '../types';
import { render as _render } from '@testing-library/react';

export function sleep(time: number) {
  return new Promise<void>(resolve => setTimeout(resolve, time));
}

export function createPost(id: number, layout: PostLayout = 'classic'): Post {
  return { id: `${id}`, layout, title: `title${id}` };
}

export function createPostModel(control: PostModelControl) {
  const postAdapter = createPaginationAdapter<Post>({});
  const postModel = createModel(postAdapter.initialModel);
  const getPostById = postModel.defineAccessor('normal', {
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

  const getPostList = postModel.defineAccessor<void, Post[]>('infinite', {
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

export function createControl(initialControl: PostModelControl) {
  return initialControl;
}

export function render(element: ReactNode) {
  return _render(<StrictMode>{element}</StrictMode>);
}
