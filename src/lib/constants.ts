import type { RequiredAccessorOptions } from './hooks/types';
import { isUndefined } from './utils';

export const defaultOptions: RequiredAccessorOptions = {
  retryCount: 3,
  retryInterval: 1000,
  revalidateOnMount: false,
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupeInterval: 2000,
  pollingInterval: 0,
  checkHasData: value => !isUndefined(value),
  keepPreviousData: false,
};
