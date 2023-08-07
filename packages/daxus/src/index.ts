import type { InfiniteAction, Action } from './model/types.js';
import type { InfiniteAccessorCreator, AccessorCreator } from './model/Model.js';
import type { AccessorOptions, UseAccessorReturn } from './hooks/types.js';
import type {
  Accessor,
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
import { createDatabase } from './model/index.js';
import { useAccessor, useHydrate, useModel, useSuspenseAccessor } from './hooks/index.js';
import { createPaginationAdapter, createPaginationState } from './adapters/index.js';
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
  Accessor,
  InfiniteAccessor,
  BaseAccessor,
  InfiniteAccessorCreator,
  AccessorCreator,
  InfiniteAction,
  Action,
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
  createDatabase,

  // hook
  useAccessor,
  useHydrate,
  useModel,
  useSuspenseAccessor,

  // adapter
  createPaginationAdapter,
  createPaginationState,

  // context
  AccessorOptionsProvider,
  ServerStateKeyProvider,
  useServerStateKeyContext,
  DatabaseProvider,
  useDatabaseContext,
};
