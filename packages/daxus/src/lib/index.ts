import type { InfiniteAction, NormalAction } from './model/types.js';
import type { InfiniteAccessorCreator, NormalAccessorCreator } from './model/Model.js';
import type { AccessorOptions, UseAccessorReturn } from './hooks/types.js';
import type {
  NormalAccessor,
  InfiniteAccessor,
  BaseAccessor,
  FetchPromiseResult,
} from './model/index.js';
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
import { createModel, createAutoModel, createDatabase } from './model/index.js';
import { useAccessor, useHydrate, useModel, useSuspenseAccessor } from './hooks/index.js';
import { createPaginationAdapter } from './adapters/index.js';
import {
  AccessorOptionsProvider,
  ServerStateKeyProvider,
  useServerStateKeyContext,
  DatabaseProvider,
  useDatabaseContext,
} from './contexts/index.js';

export type {
  AccessorOptions,
  UseAccessorReturn,
  NormalAccessor,
  InfiniteAccessor,
  BaseAccessor,
  InfiniteAccessorCreator,
  NormalAccessorCreator,
  InfiniteAction,
  NormalAction,
  FetchPromiseResult,

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
  createAutoModel,
  createDatabase,

  // hook
  useAccessor,
  useHydrate,
  useModel,
  useSuspenseAccessor,

  // adapter
  createPaginationAdapter,

  // context
  AccessorOptionsProvider,
  ServerStateKeyProvider,
  useServerStateKeyContext,
  DatabaseProvider,
  useDatabaseContext,
};
