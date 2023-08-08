# `ServerStateKeyProvider`

Use this component to provide a server state key. A server state key is used to prevent each request from sharing the same model's state. If you are using client side rendering only, then you don't need to wrap your app with this component.

```tsx
import { ServerStateKeyProvider } from 'daxus';

function App() {
  return <ServerStateKeyProvider value={{}}>...</ServerStateKeyProvider>;
}
```

The value requires an object. You can simply pass an empty object without wrapping it in an `useMemo` because it would not be used in client side.
