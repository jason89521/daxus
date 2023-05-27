# React Server Model

React Server Model is a data management library designed for front-end application development. It provides a consistent and efficient solution for organizing and synchronizing data in front-end applications, making it easier for developers to handle data fetching, management, and synchronization.

In React Server Model, the core concept is the Model. A Model is a unit used to organize and manage data. Developers can create multiple Models based on the requirements of their application, each containing multiple data models such as Post, Comment, and more.

Developers can use the provided Adapters to handle data normalization for individual Models, ensuring consistency among different data within a Model. Additionally, developers have the flexibility to define the shape of a Model to accommodate specific application needs.

## Why Create This Project

I use Redux for state management in my work. One of the advantages of Redux is that it centralizes all the states, and we can use actions to update them. For example, when a user creates a comment, we expect the `post.totalCommentCount` to increase.

However, this convenience comes with some drawbacks, with the biggest one being code splitting. Since Redux centralizes all the code in the store, it results in a large initial JavaScript bundle size.

Some of my colleagues have tried incorporating SWR into our internal systems to manage server state. While SWR requires much less code compared to Redux, some team members find it less user-friendly because we are accustomed to mutating the required state in Redux (especially when using `useSWRInfinite`).

Based on these reasons, I want to attempt developing a library that meets our work requirements.

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

## API

### `createModel`

Create a model. The first argument is the initial state of the model (the shape of the model).

We can define two type of the action: `'normal'` or `'infinite'`. For each action, the `fetchData` and `syncModel` are required to implement. The `onError` and `onSuccess` is optional.

```ts
export const postModel = createModel(initialModel);

export const getPostById = postModel.defineAction('normal', {
  fetchData: async (id: number) => {
    const data = await getPostByIdRequest(id);
    return data;
  },
  syncModel: (draft, { data }) => {
    postAdapter.upsertOne(draft, data);
  },
  onError: ({ error, arg }) => {
    console.log(`Error on getPostById with arg: ${arg}`);
    console.log(error);
  },
  onSuccess: ({ data, arg }) => {
    console.log(`Success on getPostById with arg: ${arg}`);
    console.log(data);
  },
});

export const getPostList = postModel.defineAction<{ layout: PostLayout }, Post[]>('infinite', {
  fetchData: async ({ layout }, { pageIndex, previousData }) => {
    if (previousData?.length === 0) return null;
    const data = await getPostListRequest({ layout, page: pageIndex });
    return data;
  },
  syncModel: (draft, { data, arg, pageIndex }) => {
    const paginationKey = JSON.stringify(arg);
    postAdapter.updatePagination(draft, { data: data, paginationKey, pageIndex });
  },
  onError: ({ error, arg }) => {
    console.log(`Error on getPostList with arg: ${arg}`);
    console.log(error);
  },
  onSuccess: ({ data, arg }) => {
    console.log(`Success on getPostList with arg: ${arg}`);
    console.log(data);
  },
});
```

### `useFetch`

Fetch the data to sync the corresponding model.

```ts
function usePost(id: number) {
  const { data, isFetching } = useFetch(getPostById(id), model => postAdapter.readOne(model, id), {
    revalidateOnFocus: false,
  });

  return { data, isFetching };
}
```

The type of the third argument:

```ts
export interface FetchOptions<S = any> {
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  revalidateIfStale?: boolean;
  checkHasStaleDataFn?: (snapshot: S) => boolean;
  retryCount?: number;
}
```

- `revalidateOnFocus`: Whether the hook should refetch the data when the browser get the user's focus.
- `revalidateOnReconnect`: Whether the hook should refetch the data when the user reconnect the network.
- `revalidateIfStale`: Whether the hook should fetch the data if there is a stale data in the model.
- `checkHasStaleDataFn`: To check whether there is a stale data. Default is `(snapshot) => !undefined(snapshot)`.
- `retryCount`: The error retry number.

### `useInfiniteFetch`

The api is similar to `useFetch` except it has `fetchNextPage` function.

```ts
function usePostList(layout: PostLayout) {
  const key = JSON.stringify({ layout });
  const { data, isFetching, fetchNextPage } = useInfiniteFetch(getPostList({ layout }), model => {
    return postAdapter.getPagination(model, key);
  });

  return { data, isFetching, fetchNextPage };
}
```

## Todo

- [ ] SSR
