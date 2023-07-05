import { useServerStateKeyContext } from '../contexts/index.js';
import { isServer } from '../utils/index.js';

const dataset = new WeakSet();

/**
 * This function will call the `update` when the data change.
 * You can use it for server side render.
 * @param data This data will be store in a weak set, if it doesn't appear in the weak set, the `update` function will be invoked.
 * @param update A function which receive a server state key. You should pass this key when you mutate any model.
 */
export function useHydrate<T extends object>(
  data: T,
  update: (serverStateKey?: object) => void
): void {
  const serverStateKey = useServerStateKeyContext();

  if (isServer()) {
    if (!dataset.has(data)) {
      dataset.add(data);
      update(serverStateKey);
    }
  }

  if (!dataset.has(data)) {
    dataset.add(data);
    update(serverStateKey);
  }
}
