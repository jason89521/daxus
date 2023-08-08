# `useSuspenseAccessor`

```ts
const { data, accessor } = useSuspenseAccessor(accessor, getSnapshot, options);
```

When using this hook, ensure that your component is wrapped in React's `Suspense` component and an error boundary component. This is important because this hook might throw a promise when the accessor is fetching or an error when fetching fails.

This hook is nearly identical to the [`useAccessor`](./useAccessor.md) hook, with the difference that it doesn't return `isFetching`, `isLoading`, and `error`.

## Return Value

### `data`

Same as the `data` in [`useAccessor`](./useAccessor.md), with the distinction that it is ensured to be the desired data and is defined.

### `accessor`

Same as the `accessor` in [`useAccessor`](./useAccessor.md).

## Parameters

The parameters are the same as those of [`useAccessor`](./useAccessor.md).
