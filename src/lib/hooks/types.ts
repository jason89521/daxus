import type { Accessor } from '../model';

export interface AccessorOptions<S = any> {
  /**
   *  Whether the accessor should revalidate data when the user refocuses the page.
   */
  revalidateOnFocus?: boolean;
  /**
   * Whether the accessor should revalidate data when the user reconnects to the network.
   */
  revalidateOnReconnect?: boolean;
  /**
   * Whether it should revalidate when the `accessor` changes.
   */
  revalidateOnMount?: boolean;
  /**
   * Whether it should revalidate when the data, for which the `accessor` is responsible for fetching, is stale.
   */
  revalidateIfStale?: boolean;
  /**
   * A function to determine whether the returned data from the `getSnapshot` function is what you want. If it isn't, then it will revalidate.
   */
  checkHasData?: (snapshot: S) => boolean;
  /**
   * The number of retry attempts for errors.
   */
  retryCount?: number;
  /**
   * The interval in milliseconds between retry attempts for errors.
   */
  retryInterval?: number;
  /**
   * The time span in milliseconds to deduplicate requests with the same accessor.
   */
  dedupeInterval?: number;
  /**
   * The interval in milliseconds for polling data. If the value is less than or equal to 0, polling is disabled.
   */
  pollingInterval?: number;
}

export type RequiredAccessorOptions<S = unknown> = Required<AccessorOptions<S>>;

export type UseAccessorReturn<S, E, ACC extends Accessor<any, any, E> | null> = {
  /**
   * Whether the accessor is currently fetching data.
   */
  readonly isFetching: boolean;
  /**
   * The error thrown by the `fetchData` defined in the accessor. It is set when all retry attempts fail.
   */
  readonly error: E | null;
  /**
   * The snapshot returned by the `getSnapshot` function.
   */
  readonly data: S;
  accessor: ACC;
};
