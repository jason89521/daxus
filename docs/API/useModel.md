# `useModel`

This hook is useful when you only want to subscribe the state of a model, but don't want to use any accessor to trigger a request.

```ts
const snapshot = useModel(model, getSnapshot);
```

## Return Value

The return value of the `getSnapshot` function.

## Parameters

### `model`

The model you want to subscribe

### `getSnapshot`

Return the data you want whenever the state of the model changes. Make sure that this function is wrapped by `useCallback`. Otherwise it would cause unnecessary rerender.
