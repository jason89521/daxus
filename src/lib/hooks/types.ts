export interface FetchOptions<S = any> {
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  revalidateIfStale?: boolean;
  checkHasStaleDataFn?: (snapshot: S) => boolean;
  retryCount?: number;
  dedupeInterval?: number;
}
