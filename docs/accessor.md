# Model and Accessor

In Daxus, you need to create different models for different types of data. For example, you can create a model for post data and another model for comment data.

The reason for creating different models is that different data may require different data structures. Pagination structure is suitable for post data, while it may not be as suitable for user data.

```ts
const postAdapter = createPaginationAdapter<Post>();
const postModel = createModel({ initialState: postAdapter.getInitialState() });
```

Daxus provides a pagination helper function called `createPaginationAdapter`. It helps you build and easily read/write pagination structures. For more information, you can refer to the [pagination page](./pagination.md).

> We encourage the use of adapters for any read or write operations to the state of your model, as it makes your code easier to read.

## Define Accessor

Accessors play a crucial role in Daxus. Almost all functionality is built upon them, including deduplication, revalidation on focus, and subscribing to the state of the model.

```ts
const getPostById = postModel.defineAccessor<Post, string>({
  fetchData: postId => {
    return getPostApi({ postId });
  },
  syncState: (draft, { data }) => {
    postAdapter.upsertOne(draft, data);
  },
  onSuccess: ({ data, arg }) => {
    // some effect when fetching success
  },
  onError: ({ error, arg }) => {
    // some effect when fetching error
  },
});
```

To define an accessor, you need to provide three pieces of information to your model. The `name` property is the name of its creator. The `fetchData` function specifies how to fetch the remote data, while the `syncState` function determines how to sync the fetched data to the state of the model.

Moreover, you can specify `onSuccess` and `onError` to perform some side effect when fetching success or fail.

`defineAccessor` returns an accessor creator that you can use to create an accessor. We encourage you to name the creator based on its purpose. In the example above, the accessor fetches post based on the given ID, so it is named `getPostById`.

> There is another method called `defineInfiniteAccessor` that is useful when implementing infinite scrolling.

### `useAccessor`

To integrate Daxus into your React app, you need to use a hook called `useAccessor`. This hook helps you utilize the accessor, including subscribing to the corresponding model and determining when to revalidate the data.

```ts
function usePost(id: string) {
  return useAccessor(getPostById(id), state => postAdapter.tryReadOne(state, id), {
    checkHasData: post => post?.content !== '',
    revalidateIfStale: true,
  });
}
```

Since accessors can deduplicate requests, you can use this hook anywhere without worrying about excessive requests.

### Revalidation

When using the `useAccessor` hook, revalidation occurs in the following cases:

- The return value of `checkHasData` is `false`.
- The accessor is stale, and `revalidateIfStale` is `true`.
- The accessor is changed, and `revalidateOnMount` is `true`.
- The window regains focus, and `revalidateOnFocus` is `true`.
- The network is reconnected, and `revalidateOnReconnect` is `true`.

You can also manually revalidate the data:

```ts
getPostById(id).revalidate();
```

Note that this method should only be used on the client side and not on the server side.

Instead of manually revalidating the accessor, you can use `invalidate` to indicate to Daxus that some accessors are invalid. Daxus will then check whether they need to be revalidated:

```ts
getPostById(id).invalidate(); // Invalidates only this accessor.
getPostById.invalidate(); // Invalidates any accessors generated by this accessor creator.
postModel.invalidate(); // Invalidates all accessors related to this model.
```

## Mutate

For mutating, each model provide a method called `mutate`:

```ts
postModel.mutate(draft => {
  postAdapter.createOne(draft, newPost);
});
```

Since Daxus uses `immer` internally, you can directly mutate the state of the model. Note that If you want to use this on the server side, you must put it in the `useHydrate` hook and pass the `serverStateKey` to its second argument:

```ts
useHydrate(postFromProps, serverStateKey => {
  postModel.mutate(draft => {
    postAdapter.upsertOne(draft, postFromProps);
  }, serverStateKey);
});
```

Also, you need to make sure that your app is wrapped by `ServerStateKeyProvider`:

```tsx
<ServerStateKeyProvider>
  <YourApp>
    <Component />
  </YourApp>
</ServerStateKeyProvider>
```
