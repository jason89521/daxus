import type { InfiniteAction, Action } from './model/types.js';
import type { InfiniteAccessorCreator, AccessorCreator } from './model/createModel.js';
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
import { createDatabase, createModel, createAutoModel } from './model/index.js';
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
  createModel,
  createAutoModel,

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
