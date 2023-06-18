# `useAccessor`

```ts
const { data, error, isFetching } = useAccessor(accessor, getSnapshot, options);
```

## Arguments

### `accessor`

The accessor generated from an accessor creator function. It can be `null`. This may be useful when you want conditional fetching.

### `getSnapshot`

A function that accepts the state of the `accessor`'s model and returns the desired data. Note that the `props` and `state` used in this function should also appear in the accessor creator function, otherwise it may not work properly.

### `options` (optional)

Additional options for controlling the behavior of the accessor.

#### `revalidateOnFocus`

Whether the accessor should revalidate data when the user refocuses the page. The default value is `false`.

Note: This option is applied to the first mounted hook if you have two `useAccessor` hooks with the same accessor.

Example:

```jsx
function Post({ id, revalidateOnFocus }) {
  const { data } = useAccessor(getPostById(id), getSnapshot, { revalidateOnFocus });

  return <div>{data.title}</div>;
}

function Page() {
  return (
    <div>
      <Post id={0} revalidateOnFocus={true} /> {/* `true` will be applied to `revalidateOnFocus` */}
      <Post id={0} revalidateOnFocus={false} /> {/* This will be applied only if the first <Post/> component is unmounted */}
    </div>
  );
}
```

#### `revalidateOnReconnect`

Whether the accessor should revalidate data when the user reconnects to the network. The default value is `false`.

Note: This option is applied to the first mounted hook.

#### `revalidateOnMount`

Whether it should revalidate when the `accessor` changes. The default value is `false`.

#### `revalidateIfStale`

Whether it should revalidate when the data, for which the `accessor` is responsible for fetching, is stale. The default value is `false`.

#### `checkHasData`

A function to determine whether the returned data from the `getSnapshot` function is what you want. If it isn't, then it will revalidate. The default value is `(snapshot) => !isUndefined(snapshot)`.

#### `retryCount`

The number of retry attempts for errors. The default value is `3`.

Note: This option is applied to the first mounted hook.

#### `retryInterval`

The interval in milliseconds between retry attempts for errors. The default value is `1000`.

Note: This option is applied to the first mounted hook.

#### `dedupeInterval`

The time span in milliseconds to deduplicate requests with the same accessor. The default value is `2000`.

Note: This option is applied to the first mounted hook.

#### `pollingInterval`

The interval in milliseconds for polling data. If the value is less than or equal to 0, polling is disabled. The default value is `0`.

Note: This option is applied to the first mounted hook.

## Returns

### `data`

The data returned by the `getSnapshot` function.

### `error`

The error thrown by the `fetchData` defined in the accessor. It is set when all retry attempts fail.

### `isFetching`

A boolean indicating whether the accessor is currently fetching data.
