## Getting Started

In React Server Model, the smallest unit is a `model`. Before getting started, we need to define the type of the model:

```typescript
export type PostLayout = 'image' | 'classic';

export interface Post {
  id: number;
  title: string;
  layout: PostLayout;
}
```

Once we have the type of the model, we can proceed to create the model:

```typescript
import { createModel, createPaginationAdapter } from 'react-server-model';

export const postAdapter = createPaginationAdapter<Post>({});

export const postModel = createModel(postAdapter.initialModel);
```

Your model can have any shape, and React Server Model provides `createPaginationAdapter` to help create a pagination-based model.

After creating the model, we can define actions:

```typescript
export const getPostById = postModel.defineAction<number, Post>('normal', {
  fetchData: async id => {
    const data = await getPostFromServer(id);
    return data; // the type of data is `Post`
  },
  syncModel: (model, { data, arg }) => {
    // arg -> would be the id of the post
    postAdapter.upsertOne(model, data);
  },
});

export const getPostList = postModel.defineAction<{ layout: PostLayout }, Post[]>('infinite', {
  fetchData: async ({ layout }, { pageIndex, previousData }) => {
    // If the previous API returns an empty array, stop fetching.
    if (previousData?.length === 0) return null;
    const data = await getPostListFromServer({ layout, page: pageIndex });
    return data;
  },
  syncModel: (draft, { data, arg, pageIndex }) => {
    // arg -> { layout }
    // You can use any function to generate the pagination key.
    // We use `JSON.stringify` for simplicity here.
    const paginationKey = JSON.stringify(arg);
    if (pageIndex === 0) {
      postAdapter.replacePagination(draft, paginationKey, data);
    } else {
      postAdapter.appendPagination(draft, paginationKey, data);
    }
  },
});
```

There are two types of actions: `'normal'` and `'infinite'`. When the API follows a pagination format, using the `'infinite'` action is more suitable. In other cases, the `'normal'` action will suffice.

Next, let's implement `usePost`:

```typescript
import { useFetch } from 'react-server-model';

export function usePost(id: number) {
  const result = useFetch(getPostById(id), model => {
    return postAdapter.readOne(model, id);
  });

  return result; // { data, error, isFetching }
}
```

In `usePost`, we utilize `useFetch`, `getPostById`, and `postAdapter`. The first two parameters of `useFetch` are required: the action's return value and a function to obtain the model snapshot. In this example, we use `postAdapter.readOne` to retrieve posts with different IDs.

The benefit of using `useFetch` is that it helps deduplicate identical requests and automatically revalidates data in the model under certain conditions. Users only need to define how to fetch data and synchronize the model in the action.

The implementation of `usePostList` is similar:

```typescript
import { useInfiniteFetch } from 'react-server-model';

export function usePostList(layout: PostLayout) {
  const result = useInfiniteFetch(getPostList({ layout }), model => {
    return postAdapter.readPagination({ layout });
  });

  return result; // { data, error, isFetching, fetchNextPage }
}
```

The usage of `useInfiniteFetch` is almost identical to `useFetch`, with the difference being the addition of `fetchNextPage` to fetch the next page of data.

Next, let's cover the method for mutating the model. Here, we assume that we need to create a post and add it to the corresponding pagination:

```typescript
export function createPost(title: string, layout: PostLayout) {
  const response = await createPostFromServer({ title, layout });
  postModel.mutate(model => {
    const key = JSON.stringify({ layout });
    postAdapter.appendPagination(model, key, response);
  });
}
```

As you can see, we can easily mutate the model using `postModel.mutate`.
