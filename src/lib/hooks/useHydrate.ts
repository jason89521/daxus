import { useServerStateKeyContext } from '../contexts';
import { isServer } from '../utils';

const dataset = new WeakSet();

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
