import type { InfiniteAction, NormalAction } from './model/types';
import type { InfiniteAccessorCreator, NormalAccessorCreator } from './model/Model';
import type { AccessorOptions, UseAccessorReturn } from './hooks/types';
import type { NormalAccessor, InfiniteAccessor, Accessor } from './model';
import type { AccessorOptionsProviderProps } from './contexts';
import type {
  PaginationAdapter,
  Pagination,
  PaginationMeta,
  PaginationState,
  Id,
} from './adapters';
import { createModel } from './model';
import { useAccessor, useHydrate } from './hooks';
import { createPaginationAdapter } from './adapters';
import { AccessorOptionsProvider } from './contexts';

export type {
  AccessorOptions,
  UseAccessorReturn,
  NormalAccessor,
  InfiniteAccessor,
  Accessor,
  AccessorOptionsProviderProps,
  InfiniteAccessorCreator,
  NormalAccessorCreator,
  InfiniteAction,
  NormalAction,

  // adapter
  PaginationAdapter,
  Pagination,
  PaginationMeta,
  PaginationState,
  Id,
};
export { createModel, useAccessor, useHydrate, createPaginationAdapter, AccessorOptionsProvider };
