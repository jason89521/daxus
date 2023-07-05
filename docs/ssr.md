# Server Side Rendering

```jsx
function App({ Component, ...props }) {
  return (
    <ServerStateKeyProvider>
      <div>
        <HydrateModels user={props.user} />
        <Component {...props} />
      </div>
    </ServerStateKeyProvider>
  );
}

function HydrateModels({ user }) {
  useHydrate(user, serverStateKey => {
    userModel.mutate(draft => {
      draft.data = { ...user };
    }, serverStateKey);
  });

  return null;
}
```

To prevent state pollution on the server side, you should wrap your app with `ServerStateKeyProvider`. The `useHydrate` function's first argument is what data you want to hydrate. This argument should be an object because it would be stored in a weak set.

`useHydrate` will invoke the second argument whenever the first argument changes. The second argument is a function which accepts a `serverStateKey` as its parameter. You need to pass it model's `mutate` method when you mutate any model.
