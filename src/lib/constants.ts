import type { RequiredFetchOptions } from './hooks/types';
import { isUndefined } from './utils';

export const defaultOptions: RequiredFetchOptions = {
  retryCount: 3,
  retryInterval: 1000,
  revalidateOnMount: false,
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupeInterval: 2000,
  pollingInterval: 0,
  checkHasStaleData: value => !isUndefined(value),
};
