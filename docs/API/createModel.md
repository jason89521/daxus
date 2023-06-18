# `createModel`

Create an model for your data type.

```ts
const { mutate, defineAccessor, getState } = createModel(initialState);
```

## Argument

### `initialState`

The initial state for the model.

## Returns

### `mutate`

Mutate the state of the model.

```ts
model.mutate(draft => {
  // some mutation
});
```

### `defineAccessor`

Define the accessor for the model.

```ts
const accessorCreator = model.defineAccessor(type, action);
```

#### `type`

Only `'normal'` and `'infinite'` are available. You will need to define different `action` based on the type.

#### `action`

```ts
interface BaseAction<Arg, D, E> {
  onError?: (info: { error: E; arg: Arg }) => void;
  onSuccess?: (info: { data: D; arg: Arg }) => void;
}

interface NormalAction<S, Arg = any, Data = any, E = unknown> extends BaseAction<Arg, Data, E> {
  fetchData: (arg: Arg) => Promise<Data>;
  syncState: (draft: Draft<S>, payload: { arg: Arg; data: Data }) => void;
}

interface InfiniteAction<S, Arg = any, Data = any, E = unknown> extends BaseAction<Arg, Data[], E> {
  fetchData: (
    arg: Arg,
    meta: { previousData: Data | null; pageIndex: number }
  ) => Promise<Data | null>;
  syncState: (
    draft: Draft<S>,
    payload: { data: Data; arg: Arg; pageSize: number; pageIndex: number }
  ) => void;
}
```

For `NormaAction`, the `fetchData` function is used to fetch the data based on the `arg`. This function should return a promise with `Data`. `syncState` defines how you want to synchronize the data from `fetchData` to the state of the model.

For `InfiniteAction`, `fetchData` accepts a second parameter called `meta`, in addition to the `arg`. The `previousData` parameter represents the data from the previous page. It would be `null` if this is the first page. `pageIndex` is the index of the page, starting from 0. If the `fetchData` function returns a promise that resolves to `null`, it indicates that there is no more data to fetch. The syncState function's payload now includes `pageIndex` and `pageSize`.

### `getState`

Returns the internal state of the model.
