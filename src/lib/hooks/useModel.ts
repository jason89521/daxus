import { useMemo, useSyncExternalStore } from 'react';
import type { Model } from '../model/index.js';
import { useServerStateKeyContext } from '../index.js';
import { stableHash } from '../utils/index.js';

/**
 * This hook is useful when you only want to subscribe the state of a model, but don't want to use any accessor to trigger a request.
 *
 * @param model The model you want to subscribe
 * @param getSnapshot
 * Return the data you want whenever the state of the model changes.
 * Make sure that this function is wrapped by `useCallback`. Otherwise it would cause unnecessary rerender.
 * @returns The return value of the `getSnapshot` function.
 */
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
