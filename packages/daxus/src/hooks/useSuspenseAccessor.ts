import type { AccessorOptions, AutoAccessorOptions } from './types.js';
import type { Accessor, InfiniteAccessor, AutoState, BaseAccessor } from '../model/index.js';

import { normalizeArgs, useAccessor } from './useAccessor.js';
import { useContext } from 'react';
import type { NonUndefined } from '../utils/index.js';
import { isNonUndefined, isUndefined } from '../utils/index.js';
import { useServerStateKeyContext, accessorOptionsContext } from '../contexts/index.js';

interface ReturnValue<S, ACC extends BaseAccessor<any, any, any, any> | null> {
  data: S;
  accessor: ACC;
}

export function useSuspenseAccessor<S, Arg, RD, SS, E = unknown>(
  accessor: Accessor<S, Arg, RD, E>,
  getSnapshot: (state: S) => SS,
  options?: AccessorOptions<SS>
): ReturnValue<NonUndefined<SS>, Accessor<S, Arg, RD, E>>;

export function useSuspenseAccessor<S, Arg, RD, SS, E = unknown>(
  accessor: Accessor<S, Arg, RD, E> | null,
  getSnapshot: (state: S) => SS,
  options?: AccessorOptions<SS>
): ReturnValue<NonUndefined<SS>, Accessor<S, Arg, RD, E>>;

export function useSuspenseAccessor<S, Arg, RD, SS, E = unknown>(
  accessor: InfiniteAccessor<S, Arg, RD, E>,
  getSnapshot: (state: S) => SS,
  options?: AccessorOptions<SS>
): ReturnValue<NonUndefined<SS>, InfiniteAccessor<S, Arg, RD, E>>;

export function useSuspenseAccessor<S, Arg, RD, SS, E = unknown>(
  accessor: InfiniteAccessor<S, Arg, RD, E> | null,
  getSnapshot: (state: S) => SS,
  options?: AccessorOptions<SS>
): ReturnValue<NonUndefined<SS>, InfiniteAccessor<S, Arg, RD, E>>;

export function useSuspenseAccessor<Arg, D, E, SS = D | undefined>(
  accessor: Accessor<AutoState, Arg, D, E>,
  options?: AutoAccessorOptions<D, SS, Arg>
): ReturnValue<NonUndefined<SS>, Accessor<AutoState, Arg, D, E>>;

export function useSuspenseAccessor<Arg, D, E, SS = D | undefined>(
  accessor: Accessor<AutoState, Arg, D, E> | null,
  options?: AutoAccessorOptions<D, SS, Arg>
): ReturnValue<NonUndefined<SS>, Accessor<AutoState, Arg, D, E>>;

export function useSuspenseAccessor<Arg, D, E, SS = D[] | undefined>(
  accessor: InfiniteAccessor<AutoState, Arg, D, E>,
  options?: AutoAccessorOptions<D[], SS, Arg>
): ReturnValue<NonUndefined<SS>, InfiniteAccessor<AutoState, Arg, D, E>>;

export function useSuspenseAccessor<Arg, D, E, SS = D[] | undefined>(
  accessor: InfiniteAccessor<AutoState, Arg, D, E> | null,
  options?: AutoAccessorOptions<D[], SS, Arg>
): ReturnValue<NonUndefined<SS>, InfiniteAccessor<AutoState, Arg, D, E>>;

export function useSuspenseAccessor<S, D, SS, E = unknown>(
  accessor: BaseAccessor<S, any, D, E> | null,
  maybeGetSnapshot: ((state: S) => SS) | AutoAccessorOptions<D, SS> = {},
  accessorOptions: AccessorOptions<SS> = {}
): ReturnValue<NonUndefined<SS>, BaseAccessor<S, any, D, E>> {
  const serverStateKey = useServerStateKeyContext();
  const [, options] = normalizeArgs(accessor, maybeGetSnapshot, accessorOptions);
  const defaultOptions = useContext(accessorOptionsContext);
  const { checkHasData } = { ...defaultOptions, ...options };
  const { data, error } = useAccessor(
    accessor as any,
    maybeGetSnapshot as any,
    accessorOptions
  ) as {
    data: SS;
    error: E;
  };

  if (!accessor) throw Promise.resolve();

  const hasData = !isUndefined(data) ? checkHasData(data) : false;

  if (!hasData || !isNonUndefined(data)) {
    if (accessor.getStatus().isFetching) {
      throw Promise.resolve();
    } else {
      throw accessor.revalidate({ serverStateKey });
    }
  }

  if (error && !hasData) {
    throw error;
  }

  return {
    data,
    accessor,
  };
}
