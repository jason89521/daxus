# `AccessorOptionsProvider`

Use the `AccessorOptionsProvider` component to overwrite the default accessor options.

```tsx
import { AccessorOptionsProvider, AccessorOptions } from 'daxus';

const defaultOptions: AccessorOptions = {
  staleTime: 10000,
  dedupeInterval: 3000,
};

function App() {
  return <AccessorOptionsProvider value={defaultOptions}>...</AccessorOptionsProvider>;
}
```
