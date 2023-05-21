# React Server Model

React Server Model is a data management library designed for front-end application development. It provides a consistent and efficient solution for organizing and synchronizing data in front-end applications, making it easier for developers to handle data fetching, management, and synchronization.

In React Server Model, the core concept is the Model. A Model is a unit used to organize and manage data. Developers can create multiple Models based on the requirements of their application, each containing multiple data models such as Post, Comment, and more.

Developers can use the provided Adapters to handle data normalization for individual Models, ensuring consistency among different data within a Model. Additionally, developers have the flexibility to define the shape of a Model to accommodate specific application needs.

## Example

Get post list.

```ts
// in postModel.ts
import { createPaginationAdapter, createModel } from 'react-server-model';
import type { Post, PostLayout } from './types';

export const postAdapter = createPaginationAdapter<Post>({});

export const postModel = createModel(postAdapter.initialModel);

export const getPostList = postModel.defineAction<{ layout: PostLayout }, Post[]>('infinite', {
  fetchData: async ({ layout }, { pageIndex, previousData }) => {
    // There is no more data to fetch.
    if (previousData?.length === 0) return null;
    const res = await fetch(`/api/posts?page=${pageIndex}&layout=${layout}`);
    return res.json();
  },
  syncModel: (draft, { data, arg, pageIndex }) => {
    // arg -> { layout }
    // you can use any function to generate the pagination key.
    const paginationKey = JSON.stringify(arg);
    postAdapter.updatePagination(draft, { data, paginationKey, pageIndex });
  },
});

// in usePostList.ts
import { useInfiniteFetch } from 'react-server-model';
import type { PostLayout, Post } from './types';
import { getPostList } from './postModel';

export function usePostList(layout: PostLayout): Post[] {
  const key = JSON.stringify({ layout });
  const { data } = useInfiniteFetch(getPostList({ layout }), model => {
    return postAdapter.getPagination(model, key);
  });

  return data;
}
```
