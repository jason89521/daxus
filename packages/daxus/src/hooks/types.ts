import type { BaseAccessor } from '../model/index.js';

/**
 * @typeParam S The snapshot of the state.
 */
export interface AccessorOptions<S = any> {
  /**
   * Whether the accessor should revalidate data when the user refocuses the page.
   * @defaultValue `false`
   */
  revalidateOnFocus?: boolean;
  /**
   * Whether the accessor should revalidate data when the user reconnects to the network.
   * @defaultValue `false`
   */
  revalidateOnReconnect?: boolean;
  /**
   * Whether it should revalidate when the `accessor` changes.
   * @defaultValue `false`
   */
  revalidateOnMount?: boolean;
  /**
   * Whether it should revalidate when the accessor is stale.
   * @defaultValue `false`
   */
  revalidateIfStale?: boolean;
  /**
   * A function to determine whether the returned data from the `getSnapshot` function is what you want. If it isn't, then it will revalidate.
   * @defaultValue `(snapshot) => !isUndefined(snapshot)`
   */
  checkHasData?: (snapshot: S) => boolean;
  /**
   * The number of retry attempts for errors.
   * @defaultValue `3`
   */
  retryCount?: number;
  /**
   * The interval in milliseconds between retry attempts for errors.
   * @defaultValue `1000`
   */
  retryInterval?: number;
  /**
   * The time span in milliseconds to deduplicate requests with the same accessor.
   * @defaultValue `2000`
   */
  dedupeInterval?: number;
  /**
   * The interval in milliseconds for polling data. If the value is less than or equal to 0, polling is disabled.
   * @defaultValue `0`
   */
  pollingInterval?: number;
  /**
   * Return the previous data until the new data has been fetched.
   * @defaultValue `false`
   */
  keepPreviousData?: boolean;
  /**
   * This value will be used as the placeholder data if the `isLoading` is `true`.
   */
  placeholderData?: S;
  /**
   * If this value is set to `true` and `pollingInterval` is larger than zero, then it will continue to refetch the data even when the user's tab is hidden.
   */
  pollingWhenHidden?: boolean;
  /**
   * The time in milliseconds after which data is considered stale.
   */
  staleTime?: number;
}

export interface AutoAccessorOptions<D, S = any, Arg = any> extends AccessorOptions<S> {
  getSnapshot?: (data: D | undefined, arg: Arg) => S;
}

export type RequiredAccessorOptions<S = unknown> = Required<AccessorOptions<S>>;

export type UseAccessorReturn<S, E, ACC extends BaseAccessor<any, any, any, E> | null> = {
  /**
   * Whether the accessor is currently fetching data.
   */
  readonly isFetching: boolean;
  /**
   * `true` if the `checkHasData` return `false` and the accessor is fetching data.
   */
  readonly isLoading: boolean;
  /**
   * The error thrown by the `fetchData` defined in the accessor. It is set when all retry attempts fail.
   */
  readonly error: E | null;
  /**
   * The snapshot returned by the `getSnapshot` function.
   */
  readonly data: S;
  /**
   * The accessor passed to the `useAccessor`.
   */
  accessor: ACC;
};
