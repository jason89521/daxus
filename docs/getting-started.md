# Getting Started

In React Server Model, you need to define the shape of your data yourself. We take care of handling deduplication, revalidation, and other data fetching optimizations. However, it is up to you to decide how to update your data after fetching it.

## Model

We refer to different data shapes as a "model." In my company, we have data such as posts, comments, and forums. Defining the structure of these different data shapes, such as pagination, can be considered a model.

```typescript
import { createPaginationAdapter, createModel } from 'react-server-model';

const postAdapter = createPaginationAdapter({});
const postModel = createModel(postAdapter.initialModel);
```

Defining a model is straightforward. You simply use `createModel` and pass in the initial value.

> `createPaginationAdapter` is a utility function provided by us to quickly create a pagination model. However, you can also define your custom pagination model.

## Action

Once you have created a model, you can start defining actions.

```typescript
const getPostById = postModel.defineAccessor<number, Post>('normal', {
  fetchData: async id => {
    const data = await getPostFromServer(id);
    return data; // the type of data is `Post`
  },
  syncModel: (model, { data, arg }) => {
    postAdapter.upsertOne(model, data);
  },
});

const getPostList = postModel.defineAccessor<{ filter: string }, Post[]>('infinite', {
  fetchData: async ({ layout }, { pageIndex, previousData }) => {
    // If the previous API returns an empty array, stop fetching.
    if (previousData?.length === 0) return null;
    const data = await getPostListFromServer({ filter, page: pageIndex });
    return data;
  },
  syncModel: (model, { data, arg, pageIndex }) => {
    // arg -> {filter}
    // You can use any function to generate the pagination key.
    // We use `JSON.stringify` for simplicity here.
    const paginationKey = JSON.stringify(arg);
    if (pageIndex === 0) {
      postAdapter.replacePagination(model, paginationKey, data);
    } else {
      postAdapter.appendPagination(model, paginationKey, data);
    }
  },
});
```

When defining an action, you need to provide two necessary parameters: `fetchData` and `syncModel`. `fetchData` describes how this action fetches data from the server, and `syncModel` determines how the data is synchronized into your model after fetching.

You may have noticed that the first parameter of `defineAccessor` has two possible values. When implementing infinite scrolling, using `'infinite'` is a better choice. Otherwise, for most cases, `'normal'` should suffice.

## `useFetch` and `useInfiniteFetch`

After defining actions, you can use `useFetch` or `useInfiniteFetch` in a custom hook to fetch data from the server. Use `useFetch` for `'normal'` actions and `useInfiniteFetch` for `'infinite'` actions.

```typescript
import { useFetch, useInfiniteFetch } from 'react-server-model';

export function usePost(id: number) {
  const result = useFetch(getPostById(id), model => {
    return postAdapter.readOne(model, id);
  });
  return result; // {data, error, isFetching}
}

export function usePostList(filter: string) {
  const result = useInfiniteFetch(
    getPostList({ filter }),

    model => {
      const key = JSON.stringify({ filter });
      return postAdapter.readPagination(model, key);
    }
  );
  return result; // { data, error, isFetching, fetchNextPage}
}
```

The first parameter of `useFetch` and `useInfiniteFetch` is the return value of the previously defined action. The second parameter determines how to display the corresponding model data. These hooks will automatically handle the request initiation and data synchronization into your model, as defined in the actions.

You can use these custom hooks anywhere in your code, and you don't need to worry about duplicate requests because we handle that for you.

## Mutation

Finally, let's discuss model mutation. In many cases, besides fetching data from the server, we also have user interactions that update data. For example, if a user creates a new post and we want to display it in the list with the filter set to "all," we can use the `mutate` method:

```typescript
export function createPost(title: string, content: string) {
  const res = await createPostApi({ title, content });
  postModel.mutate(model => {
    model.appendPagination(model, 'all', [res]);
  });
}
```

That's it! Using `mutate`, you can directly update your model. Subsequently, the `useFetch` and `useInfiniteFetch` hooks of the corresponding actions will check if the data you want to display has changed and trigger a rerender if necessary.
