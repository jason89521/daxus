import type { AccessorOptions, AutoAccessorOptions } from './types.js';
import type { NormalAccessor, InfiniteAccessor, AutoState, Accessor } from '../model/index.js';

import { normalizeArgs, useAccessor } from './useAccessor.js';
import { accessorOptionsContext } from '../contexts/AccessorOptionsContext.js';
import { useContext, useMemo, useSyncExternalStore } from 'react';
import type { NonUndefined } from '../utils/index.js';
import { isNonUndefined, isUndefined, noop, stableHash } from '../utils/index.js';
import { useServerStateKeyContext } from '../index.js';

interface ReturnValue<S, ACC extends Accessor<any, any, any, any> | null> {
  data: S;
  accessor: ACC;
}

export function useSuspenseAccessor<S, Arg, RD, SS, E = unknown>(
  accessor: NormalAccessor<S, Arg, RD, E>,
  getSnapshot: (state: S) => SS,
  options?: AccessorOptions<SS>
): ReturnValue<NonUndefined<SS>, NormalAccessor<S, Arg, RD, E>>;

export function useSuspenseAccessor<S, Arg, RD, SS, E = unknown>(
  accessor: NormalAccessor<S, Arg, RD, E> | null,
  getSnapshot: (state: S) => SS,
  options?: AccessorOptions<SS>
): ReturnValue<NonUndefined<SS>, NormalAccessor<S, Arg, RD, E>>;

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
  accessor: NormalAccessor<AutoState, Arg, D, E>,
  options?: AutoAccessorOptions<D, SS>
): ReturnValue<NonUndefined<SS>, NormalAccessor<AutoState, Arg, D, E>>;

export function useSuspenseAccessor<Arg, D, E, SS = D | undefined>(
  accessor: NormalAccessor<AutoState, Arg, D, E> | null,
  options?: AutoAccessorOptions<D, SS>
): ReturnValue<NonUndefined<SS>, NormalAccessor<AutoState, Arg, D, E>>;

export function useSuspenseAccessor<Arg, D, E, SS = D[] | undefined>(
  accessor: InfiniteAccessor<AutoState, Arg, D, E>,
  options?: AutoAccessorOptions<D[], SS>
): ReturnValue<NonUndefined<SS>, InfiniteAccessor<AutoState, Arg, D, E>>;

export function useSuspenseAccessor<Arg, D, E, SS = D[] | undefined>(
  accessor: InfiniteAccessor<AutoState, Arg, D, E> | null,
  options?: AutoAccessorOptions<D[], SS>
): ReturnValue<NonUndefined<SS>, InfiniteAccessor<AutoState, Arg, D, E>>;

export function useSuspenseAccessor<S, D, SS, E = unknown>(
  accessor: Accessor<S, any, D, E> | null,
  maybeGetSnapshot: ((state: S) => SS) | AutoAccessorOptions<D, SS> = {},
  accessorOptions: AccessorOptions<SS> = {}
): ReturnValue<NonUndefined<SS>, Accessor<S, any, D, E>> {
  const [, options] = normalizeArgs(accessor, maybeGetSnapshot, accessorOptions);
  const defaultOptions = useContext(accessorOptionsContext);
  const { checkHasData } = { ...defaultOptions, ...options };
  const { data } = useAccessor(accessor as any, maybeGetSnapshot as any, accessorOptions) as {
    data: SS;
  };

  if (!accessor) throw new Promise(noop);

  const hasData = !isUndefined(data) ? checkHasData(data) : false;

  if (!hasData || !isNonUndefined(data)) {
    if (accessor.getStatus().isFetching) {
      throw new Promise(noop);
    } else {
      throw accessor.revalidate();
    }
  }

  return {
    data,
    accessor,
  };
}
