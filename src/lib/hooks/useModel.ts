import { useMemo, useSyncExternalStore } from 'react';
import type { Model } from '../model/index.js';
import { useServerStateKeyContext } from '../index.js';
import { stableHash } from '../utils/index.js';

export function useModel<S extends object, SS>(model: Model<S>, getSnapshot: (state: S) => SS): SS {
  const serverStateKey = useServerStateKeyContext();
  const [subscribe, getData] = useMemo(() => {
    const getState = () => {
      return model.getState(serverStateKey);
    };

    let memoizedSnapshot = getSnapshot(getState());

    return [
      (listener: () => void) => {
        return model.subscribe(() => {
          const snapshot = getSnapshot(getState());
          if (stableHash(snapshot) !== stableHash(memoizedSnapshot)) {
            memoizedSnapshot = snapshot;
            listener();
          }
        });
      },
      () => memoizedSnapshot,
    ] as const;
  }, [model, serverStateKey, getSnapshot]);

  return useSyncExternalStore(subscribe, getData, getData);
}
