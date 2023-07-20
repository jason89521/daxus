# Auto Model

In some cases, developers may not require full control over the data. For such scenarios, Daxus provides a "auto model" feature. With a auto model, you don't need to specify how to sync the fetched data to the model's state, as it handles this internally. Let's take a closer look:

```ts
const userModel = createAutoModel();

const getUser = userModel.defineNormalAccessor<string, User>({
  fetchData: async userId => {
    return getUserApi(userId);
  },
});

function useUser(userId: string) {
  return useAutoAccessor(getUser(userId));
}
```

When using `createAutoModel`, you don't need to provide an initial state, and there's no need to create an adapter because you don't have to manage how the fetched data is synced to the model's state.

It is recommended to use the `useAutoAccessor` hook with accessors defined using the auto model. This hook allows you to easily access the cached data without the need for a `getSnapshot` function. However, if desired, you can still provide a `getSnapshot` function to select specific data:

```ts
function useUserName(userId: string) {
  return useAutoAccessor(getUser(userId), user => user?.name);
}
```

## Mutation

The auto model also provides a `mutate` method, but it works slightly differently from the original model. Developers need to provide an accessor to access the corresponding cached data:

```ts
userModel.mutate(getUser(userId), prevUser => {
  return { ...prevUser, name: 'new user name' };
});
```

Note that when using the auto model, you should return a new data object instead of directly mutating the cached data.

## Get State

The `getState` method need to pass an accessor to get the corresponding cache.

```ts
userModel.getState(getUser(userId)); // -> User | undefined
```

## Limitation

When using the auto model, you lose some control over the model's state. The data is bound to the accessor, and its definition is derived from the return value of the `fetchData` function.
