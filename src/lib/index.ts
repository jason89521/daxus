import type { AccessorOptions, UseAccessorReturn } from './hooks/types';
import type { NormalAccessor, InfiniteAccessor } from './model';
import type { AccessorOptionsProviderProps } from './contexts';
import { createModel } from './model';
import { useAccessor, useHydrate } from './hooks';
import { createPaginationAdapter } from './adapters';
import { AccessorOptionsProvider } from './contexts';

export type {
  AccessorOptions,
  UseAccessorReturn,
  NormalAccessor,
  InfiniteAccessor,
  AccessorOptionsProviderProps,
};
export { createModel, useAccessor, useHydrate, createPaginationAdapter, AccessorOptionsProvider };
