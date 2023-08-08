# `useAccessor`

```ts
const { data, error, isLoading, isFetching, accessor } = useAccessor(accessor, getSnapshot, {
  retryCount: 3,
  retryInterval: 1000,
  revalidateOnMount: false,
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupeInterval: 2000,
  pollingInterval: 0,
  checkHasData: value => !isUndefined(value),
  keepPreviousData: false,
  placeholderData: undefined,
  pollingWhenHidden: false,
  staleTime: 0,
});
```

## Return Value

### `data`

The data returned from the `getSnapshot` function.

### `error`

If the accessor fails to fetch the data after retrying, this property will hold the thrown error. It will be set to `null` if the fetch is successful.

### `isFetching`

Indicates whether the accessor is currently fetching data.

### `isLoading`

This will be `true` if `checkHasData` returns `false` and the accessor is fetching. Otherwise, it will be `false`.

### `accessor`

The accessor provided as the first parameter.

## Parameters

### `accessor`

The accessor to automatically call its `revalidate` method and subscribe to its model. It can be `null`. For more information, refer to [conditional fetching](../conditional-fetching.md).

### `getSnapshot`

A function that returns the data you want from the model's state. This parameter is required because the data structure can vary. However, this parameter can be omitted if you use this hook with [auto model](../auto-model.md).

### `options`

#### `retryCount`

The number of retry attempts for errors.

#### `retryInterval`

The time span in milliseconds for deduplicating requests with the same accessor.

#### `revalidateOnMount`

Whether to revalidate when the `accessor` changes.

#### `revalidateIfStale`

Whether to revalidate when the accessor becomes stale.

#### `revalidateOnFocus`

Whether the accessor should revalidate data when the user refocuses the page.

#### `revalidateOnReconnect`

Whether the accessor should revalidate data when the user reconnects to the network.

#### `dedupeInterval`

The time span in milliseconds for deduplicating requests with the same accessor.

#### `pollingInterval`

The interval in milliseconds for polling data. If the value is less than or equal to 0, polling is disabled.

#### `checkHasData`

A function that determines whether the returned data from `getSnapshot` is valid. If it's not, revalidation will occur.

#### `keepPreviousData`

Keep the previous data until new data is fetched.

#### `placeholderData`

This value will be used as placeholder data if `isLoading` is `true`.

#### `pollingWhenHidden`

If `true` and `pollingInterval` is greater than zero, continue to refetch data even when the user's tab is hidden.

#### `staleTime`

The time in milliseconds after which data is considered stale.
