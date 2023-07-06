import type { InfiniteAction, NormalAction } from './model/types.js';
import type { InfiniteAccessorCreator, NormalAccessorCreator } from './model/Model.js';
import type { AccessorOptions, UseAccessorReturn } from './hooks/types.js';
import type { NormalAccessor, InfiniteAccessor, Accessor } from './model/index.js';
import type {
  AccessorOptionsProviderProps,
  ServerStateKeyProviderProps,
} from './contexts/index.js';
import type {
  PaginationAdapter,
  Pagination,
  PaginationMeta,
  PaginationState,
  Id,
} from './adapters/index.js';
import { createModel } from './model/index.js';
import { useAccessor, useHydrate, useModel } from './hooks/index.js';
import { createPaginationAdapter } from './adapters/index.js';
import {
  AccessorOptionsProvider,
  ServerStateKeyProvider,
  useServerStateKeyContext,
} from './contexts/index.js';

export type {
  AccessorOptions,
  UseAccessorReturn,
  NormalAccessor,
  InfiniteAccessor,
  Accessor,
  InfiniteAccessorCreator,
  NormalAccessorCreator,
  InfiniteAction,
  NormalAction,

  // context
  AccessorOptionsProviderProps,
  ServerStateKeyProviderProps,

  // adapter
  PaginationAdapter,
  Pagination,
  PaginationMeta,
  PaginationState,
  Id,
};
export {
  createModel,

  // hook
  useAccessor,
  useHydrate,
  useModel,

  // adapter
  createPaginationAdapter,

  // context
  AccessorOptionsProvider,
  ServerStateKeyProvider,
  useServerStateKeyContext,
};
