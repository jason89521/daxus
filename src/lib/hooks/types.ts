export interface FetchOptions<S = any> {
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  revalidateIfStale?: boolean;
  checkHasStaleDataFn?: (snapshot: S) => boolean;
  retryCount?: number;
  retryInterval?: number;
  dedupeInterval?: number;
  pollingInterval?: number;
}

export interface HookReturn<D, E> {
  readonly data: D;
  readonly isFetching: boolean;
  readonly error: E | null;
  revalidate: () => void;
}

export interface InfiniteHookReturn<D, E> extends HookReturn<D, E> {
  fetchNextPage: () => void;
}
