# API

## `createModel`

```ts
const model = createModel(initialModel);
```

### `model.defineAccessor`

There are two types of actions that can be defined: `'normal'` and `'infinite'`, and they require slightly different implementation details.

For `'normal'` action:

```ts
const accessorCreator = model.defineAccessor('normal', {
  fetchData = async arg => {
    // the logic of fetching data
  },
  syncModel = (model, payload) => {
    // payload -> { data, arg }
    // the logic of updating data
  },
  onSuccess = info => {
    // info -> { data, arg }
    // the code you want to execute when it sync the model successfully
  },
  onError = info => {
    // info -> { error, arg }
    // the code you want to execute when the fetching fail
  },
});
```

For `'infinite'` action:

```ts
const accessorCreator = model.defineAccessor('infinite', {
  fetchData = async (arg, meta) => {
    // meta -> { previousData, pageIndex }
    // If you return `null` in this function
    // then this fetching will be considered as no more data to fetch.
    // It will cause stopping fetching.
  },
  syncModel = (model, payload) => {
    // payload -> { data, arg, pageSize, pageIndex }
    // do the same thing as normal action
    // note that the data is by page
  },
  onSuccess = info => {
    // same as normal action
  },
  onError = info => {
    // same as normal action
  },
});
```

The returned value of `model.defineAccessor` is an 'accessor creator'. It will be used when you want to use `useFetch` or `useInfiniteFetch`.

### `model.mutate`

```ts
model.mutate(model => {
  // the logic to update your model.
});
```

This package uses `immer`, so you mutate the model directly. It will generate a new model after the mutating.

## `createPaginationAdapter`

```ts
const adapter = createPaginationAdapter({ getId });
```

This is a util function that helps you to build a pagination model.

### `getId`

This function is used to get the id from your data. Default is `data => data.id`.

### `adapter.createOne`

```ts
model.mutate(model => {
  adapter.createOne(model, data);
});
```

Create a new data in your model, this function will directly mutate the passed in model so make sure you put it in the `model.mutate`.

### `adapter.readOne`

```ts
const data = adapter.readOne(model, id);
```

Read the data from the model with the specified `id`. Return `undefined` if not exist.

### `adapter.updateOne`

```ts
model.mutate(model => {
  adapter.updateOne(model, id, partialData);
});
```

Update the existed data with `partialData`. If the data with the specified `id` is not existed, do nothing.

### `adapter.deleteOne`

```ts
model.mutate(model => {
  adapter.deleteOne(model, id);
});
```

Delete the data with the specified `id` from the model. Do nothing if the `id` is not existed.

### `adapter.upsertOne`

```ts
model.mutate(model => {
  adapter.upsertOne(model, data);
});
```

If the data has already existed in the model, then update it with the new `data`. Otherwise insert it to the model.

### `adapter.readPagination`

```ts
const { items, noMore, sizePerPage } = adapter.readPagination(model, paginationKey);
```

Return the information of the pagination with the specified `paginationKey`. Return `undefined` if the pagination is not existed.

### `adapter.replacePagination`

```ts
model.mutate(model => {
  adapter.replacePagination(model, paginationKey, data);
});
```

Replace the pagination with the specified `paginationKey`. If the pagination is not existed, create one.

### `adapter.appendPagination`

```ts
model.mutate(model => {
  adapter.appendPagination(model, paginationKey, data);
});
```

Append the `data` after the data inside the pagination with the specified `paginationKey`. If the pagination is not existed, it will throw an error.

## `useFetch`

```ts
const { data, isFetching, error } = useFetch(accessorCreator(arg), getSnapshot, options);
```

### `getSnapshot`

If will get the `model` related to the `accessorCreator` as the first argument. You should use this function to get the data you want when the corresponding fetching is done.

### `options`

All the options are optional.

#### `options.revalidateOnFocus`

Whether this hook should revalidate the data when the window get focused. Default is `true`.

#### `options.revalidateOnReconnect`

Whether this hook should revalidate the data when the user reconnect the network. Default is `true`.

#### `options.revalidateIfStale`

Whether this hook should revalidate even if there is a stale data when the returned value of the `accessorCreator` changed. Default is `true`.

#### `options.checkHasStaleDataFn`

This function is used to check whether the data got from `getSnapshot` is stale or not. Default is `data => !undefined(data)`.

#### `options.retryCount`

The error retry count when the fetching fails. Default is `3`.

#### `options.retryInterval`

The error retry interval when the fetching fails. Default is `1000`.

#### `options.dedupeInterval`

The fetching deduplication interval. Default is `2000`.
