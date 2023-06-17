export interface AccessorOptions<S = any> {
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  revalidateOnMount?: boolean;
  revalidateIfStale?: boolean;
  checkHasStaleData?: (snapshot: S) => boolean;
  retryCount?: number;
  retryInterval?: number;
  dedupeInterval?: number;
  pollingInterval?: number;
}

export type RequiredAccessorOptions<S = unknown> = Required<AccessorOptions<S>>;

export interface HookReturn<D, E> {
  readonly data: D;
  readonly isFetching: boolean;
  readonly error: E | null;
  revalidate: () => void;
}

export interface InfiniteHookReturn<D, E> extends HookReturn<D, E> {
  fetchNextPage: () => void;
}
