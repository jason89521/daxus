import type { FetchOptions } from '../hooks/types';
import type { MutableRefObject } from 'react';

const defaultOptions = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  retryCount: 3,
  retryInterval: 1000,
  dedupeInterval: 2000,
} satisfies FetchOptions;

export type Status<E = unknown> = {
  isFetching: boolean;
  error: E | null;
};

export type ModelSubscribe = (listener: () => void) => () => void;

type RetryTimeoutMeta = {
  timeoutId: number;
  reject: () => void;
};

export class ModelAccessor<M, E> {
  protected status: Status<E> = { isFetching: false, error: null };
  protected statusListeners: ((prev: Status, current: Status) => void)[] = [];
  protected dataListeners: (() => void)[] = [];
  private retryTimeoutMeta: RetryTimeoutMeta | null = null;
  private startAt = 0;
  private modelSubscribe: ModelSubscribe;
  private optionsRefSet = new Set<MutableRefObject<FetchOptions>>();
  private removeOnFocusListener: (() => void) | null = null;
  private removeOnReconnectListener: (() => void) | null = null;
  /**
   * @internal
   */
  revalidate!: () => void;

  /**
   * @internal
   */
  getModel: () => M;

  constructor(getModel: () => M, modelSubscribe: ModelSubscribe) {
    this.getModel = getModel;
    this.modelSubscribe = modelSubscribe;
  }

  /**
   * @internal
   * @returns
   */
  abortRetry() {
    if (!this.retryTimeoutMeta) return;
    clearTimeout(this.retryTimeoutMeta.timeoutId);
    this.retryTimeoutMeta.reject();
  }

  /**
   * @internal
   * @param param0
   * @returns
   */
  mount = ({ optionsRef }: { optionsRef: MutableRefObject<FetchOptions> }) => {
    this.optionsRefSet.add(optionsRef);

    if (this.getFirstOptionsRef() === optionsRef) {
      if (optionsRef.current.revalidateOnFocus ?? defaultOptions.revalidateOnFocus) {
        this.removeOnFocusListener = this.registerOnFocus();
      }
      if (optionsRef.current.revalidateOnReconnect ?? defaultOptions.revalidateOnReconnect) {
        this.removeOnReconnectListener = this.registerOnReconnect();
      }
    }

    return () => {
      // Remove the optionRef and remove the listeners.
      // If it is the first optionsRef, remove the listeners (if exist).
      const isUnmountFirstOptionsRef = this.getFirstOptionsRef() === optionsRef;
      if (isUnmountFirstOptionsRef) {
        this.removeOnFocusListener?.();
        this.removeOnReconnectListener?.();
      }
      this.optionsRefSet.delete(optionsRef);

      // If it is not the first optionsRef, do nothing.
      if (!isUnmountFirstOptionsRef) return;
      // Register next option if there is a mounted optionsRef (if exist).
      const firstOptionRef = this.getFirstOptionsRef();
      if (!firstOptionRef) {
        this.removeOnFocusListener = null;
        this.removeOnReconnectListener = null;
        return;
      }

      if (firstOptionRef.current.revalidateOnFocus ?? defaultOptions.revalidateOnFocus) {
        this.removeOnFocusListener = this.registerOnFocus();
      }
      if (firstOptionRef.current.revalidateOnReconnect ?? defaultOptions.revalidateOnReconnect) {
        this.removeOnReconnectListener = this.registerOnReconnect();
      }
    };
  };

  /**
   * @internal
   * @param listener
   * @returns
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
   * @param listener
   * @returns
   */
  subscribeData = (listener: () => void) => {
    this.dataListeners.push(listener);
    const modelUnsubscribe = this.modelSubscribe(listener);
    return () => {
      const index = this.dataListeners.indexOf(listener);
      this.dataListeners.splice(index, 1);
      modelUnsubscribe();
    };
  };

  /**
   * @internal
   * @returns
   */
  getStatus = () => {
    return this.status;
  };

  protected updateStatus = (partialStatus: Partial<Status<E>>) => {
    const newStatus = { ...this.status, ...partialStatus };
    this.notifyStatusListeners(newStatus);
    this.status = newStatus;
  };

  protected notifyStatusListeners = (newCache: Status) => {
    this.statusListeners.forEach(l => l(this.status, newCache));
  };

  protected notifyDataListeners = () => {
    this.dataListeners.forEach(l => l());
  };

  protected getOptions = () => {
    const firstOptionsRef = this.getFirstOptionsRef();
    if (!firstOptionsRef) return defaultOptions;

    return { ...defaultOptions, ...firstOptionsRef.current };
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

  protected canFetch({ currentTime }: { currentTime: number }) {
    if (!this.shouldDedupe(currentTime)) return true;
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

  private getFirstOptionsRef = () => {
    const { value } = this.optionsRefSet.values().next() as IteratorReturnResult<
      MutableRefObject<FetchOptions> | undefined
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
}
