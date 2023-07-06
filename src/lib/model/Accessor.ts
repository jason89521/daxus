import { defaultOptions } from '../constants.js';
import type { AccessorOptions } from '../hooks/types.js';
import type { MutableRefObject } from 'react';
import { isUndefined } from '../utils/index.js';

export type Status<E = unknown> = {
  isFetching: boolean;
  error: E | null;
};

export type ModelSubscribe = (listener: () => void) => () => void;

type RetryTimeoutMeta = {
  timeoutId: number;
  reject: () => void;
};

type Options = Required<AccessorOptions>;
type OptionsRef = MutableRefObject<Options>;

export abstract class Accessor<S, D, E> {
  protected status: Status<E> = { isFetching: false, error: null };
  protected statusListeners: ((prev: Status, current: Status) => void)[] = [];
  protected fetchPromise: Promise<readonly [D | null, E | null]> = Promise.resolve([null, null]);
  private retryTimeoutMeta: RetryTimeoutMeta | null = null;
  private startAt = 0;
  private modelSubscribe: ModelSubscribe;
  private optionsRefSet = new Set<OptionsRef>();
  private removeOnFocusListener: (() => void) | null = null;
  private removeOnReconnectListener: (() => void) | null = null;
  private pollingTimeoutId: number | undefined;
  private isStale = false;

  /**
   * Return the result of the revalidation.
   */
  abstract revalidate: () => Promise<readonly [D | null, E | null]>;

  /**
   * Get the state of the corresponding model.
   */
  getState: (serverStateKey?: object) => S;

  /**
   * @internal
   */
  constructor(getState: (serverStateKey?: object) => S, modelSubscribe: ModelSubscribe) {
    this.getState = getState;
    this.modelSubscribe = modelSubscribe;
  }

  /**
   * @internal
   */
  mount = ({ optionsRef }: { optionsRef: OptionsRef }) => {
    this.optionsRefSet.add(optionsRef);

    if (this.getFirstOptionsRef() === optionsRef) {
      this.removeOnFocusListener = this.registerOnFocus();
      this.removeOnReconnectListener = this.registerOnReconnect();
    }

    return () => {
      // Remove the optionRef and remove the listeners.
      // If it is the first optionsRef, remove the listeners (if exist).
      const isFirstOptionsRef = this.getFirstOptionsRef() === optionsRef;
      if (isFirstOptionsRef) {
        this.removeOnFocusListener?.();
        this.removeOnReconnectListener?.();
      }
      this.optionsRefSet.delete(optionsRef);

      // If it is not the first optionsRef, do nothing.
      if (!isFirstOptionsRef) return;
      // Register new listeners if there is a optionsRef existed after unmounting the previous one.
      const firstOptionRef = this.getFirstOptionsRef();
      if (!firstOptionRef) {
        this.removeOnFocusListener = null;
        this.removeOnReconnectListener = null;
        return;
      }

      this.removeOnFocusListener = this.registerOnFocus();
      this.removeOnReconnectListener = this.registerOnReconnect();
      clearTimeout(this.pollingTimeoutId);
    };
  };

  /**
   * @internal
   */
  subscribeStatus = (listener: (prev: Status, current: Status) => void) => {
    this.statusListeners.push(listener);
    return () => {
      const index = this.statusListeners.indexOf(listener);
      this.statusListeners.splice(index, 1);
    };
  };

  /**
   * @internal
   */
  subscribeData = (listener: () => void) => {
    const modelUnsubscribe = this.modelSubscribe(listener);
    return () => {
      modelUnsubscribe();
    };
  };

  /**
   * @internal
   */
  getStatus = () => {
    return this.status;
  };

  /**
   * Get whether this accessor is stale or not.
   *
   * @internal
   */
  getIsStale = () => {
    return this.isStale;
  };

  invalidate = () => {
    this.isStale = true;
    if (this.isMounted()) {
      this.revalidate();
    }
  };

  protected updateStatus = (partialStatus: Partial<Status<E>>) => {
    const newStatus = { ...this.status, ...partialStatus };
    this.notifyStatusListeners(newStatus);
    this.status = newStatus;
  };

  protected notifyStatusListeners = (newCache: Status) => {
    this.statusListeners.forEach(l => l(this.status, newCache));
  };

  protected getOptions = (): Required<AccessorOptions> => {
    const firstOptionsRef = this.getFirstOptionsRef();
    if (!firstOptionsRef) return defaultOptions;

    return firstOptionsRef.current;
  };

  protected getRetryCount = () => {
    return this.getOptions().retryCount;
  };

  protected getDedupeInterval = () => {
    return this.getOptions().dedupeInterval;
  };

  protected getRetryInterval = () => {
    return this.getOptions().retryInterval;
  };

  protected canFetch({ startAt }: { startAt: number }) {
    if (!this.shouldDedupe(startAt)) return true;
    if (!this.status.isFetching) return true;
    return false;
  }

  protected shouldDedupe(time: number) {
    return time - this.startAt < this.getDedupeInterval();
  }

  protected updateStartAt(time: number) {
    this.startAt = time;
  }

  protected isExpiredFetching(time: number) {
    return time < this.startAt;
  }

  protected setRetryTimeoutMeta(meta: RetryTimeoutMeta) {
    this.retryTimeoutMeta = meta;
  }

  /**
   * Call this method before fetching start.
   * This method would:
   * - clear the polling timeout
   * - abort the error retry
   * - update the `fetchPromise`
   * - update the `startAt`
   * - update the status with `{ isFetching: true }`
   */
  protected onFetchingStart = ({
    fetchPromise,
    startAt,
  }: {
    fetchPromise: Promise<readonly [D | null, E | null]>;
    startAt: number;
  }) => {
    this.fetchPromise = fetchPromise;
    console.log('onFetchingStart', this.fetchPromise);
    clearTimeout(this.pollingTimeoutId);
    this.abortRetry();
    this.updateStartAt(startAt);
    this.updateStatus({ isFetching: true });
  };

  /**
   * Call this method after the fetching is done.
   * This method would
   * - Check whether it need to start polling
   * - Reset the `fetchPromise`
   * - Update the `status.isFetching` to false
   * - Mark this accessor to be stale
   */
  protected onFetchingFinish = () => {
    const { pollingInterval } = this.getOptions();
    if (pollingInterval > 0) {
      this.pollingTimeoutId = window.setTimeout(this.invokePollingRevalidation, pollingInterval);
    }
    this.updateStatus({ isFetching: false });
    this.isStale = true;
  };

  private getFirstOptionsRef = () => {
    const { value } = this.optionsRefSet.values().next() as IteratorReturnResult<
      OptionsRef | undefined
    >;
    return value;
  };

  private registerOnFocus = () => {
    const revalidate = () => {
      if (this.getOptions().revalidateOnFocus) {
        this.revalidate();
      }
    };

    window.addEventListener('focus', revalidate);

    return () => {
      window.removeEventListener('focus', revalidate);
    };
  };

  private registerOnReconnect = () => {
    const revalidate = () => {
      if (this.getOptions().revalidateOnReconnect) {
        this.revalidate();
      }
    };

    window.addEventListener('online', revalidate);

    return () => {
      window.removeEventListener('online', revalidate);
    };
  };

  /**
   * invoke `this.revalidate` if `options.pollingInterval` is larger than 0.
   * @returns
   */
  private invokePollingRevalidation = () => {
    const { pollingInterval } = this.getOptions();
    if (pollingInterval <= 0) return;
    this.revalidate();
  };

  /**
   * Reject the current error retry and clear the error retry timeout.
   */
  private abortRetry = (): void => {
    if (!this.retryTimeoutMeta) return;
    clearTimeout(this.retryTimeoutMeta.timeoutId);
    console.log('abort retry', this.fetchPromise);
    this.retryTimeoutMeta.reject();
  };

  /**
   * Determine whether this accessor is mounted by check whether there is an options ref.
   */
  private isMounted = () => {
    return !isUndefined(this.getFirstOptionsRef());
  };
}
