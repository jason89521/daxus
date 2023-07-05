# Conditional Fetching

## Conditional

`useAccessor` will not start a request if the accessor is `null`.

```ts
function useUser(id?: string) {
  const accessor = id ? getUser(id) : null;
  return useAccessor(accessor, state => state.data);
}
```

## Dependent

Daxus also allow you to fetch data that depends on other data.

```ts
function useMyPost(id: string) {
  const { data: user } = useAccessor(getUser(id), state => state.data);
  const { data: myPost } = useAccessor(user ? getMyPost(user.id) : null, state => state.data);

  return myPost;
}
```
