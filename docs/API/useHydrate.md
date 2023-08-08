# `useHydrate`

This hook is used for SSR. When using this hook, you should make sure that your app is wrapped by the [`ServerStateKeyProvider`](./ServerStateKeyProvider.md) component.

```ts
useHydrate(data, updateFn);
```

## Parameters

### `data`

This value should be an object or `undefined`. If it is an object, then this hook would store it in a `WeakSet`. When the weak set doesn't have this value, this hook would invoke the `updateFn`.

### `updateFn`

A function receives a `serverStateKey`. You should pass the `serverStateKey` to the `mutate` method of an model

```ts
useHydrate(data, serverStateKey => {
  dataModel.mutate(draft => {
    draft.data = data;
  }, serverStateKey);
});
```
