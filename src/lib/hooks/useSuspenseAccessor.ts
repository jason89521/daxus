import type { AccessorOptions, AutoAccessorOptions } from './types.js';
import type { NormalAccessor, InfiniteAccessor, AutoState, Accessor } from '../model/index.js';

import { normalizeArgs } from './useAccessor.js';
import { accessorOptionsContext } from '../contexts/AccessorOptionsContext.js';
import { useContext } from 'react';
import { noop } from '../utils/noop.js';

interface ReturnValue<S, ACC extends Accessor<any, any, any, any> | null> {
  data: S;
  accessor: ACC;
}

export function useSuspenseAccessor<S, Arg, RD, SS, E = unknown>(
  accessor: NormalAccessor<S, Arg, RD, E>,
  getSnapshot: (state: S) => SS,
  options?: AccessorOptions<SS>
): ReturnValue<NonNullable<SS>, NormalAccessor<S, Arg, RD, E>>;

export function useSuspenseAccessor<S, Arg, RD, SS, E = unknown>(
  accessor: NormalAccessor<S, Arg, RD, E> | null,
  getSnapshot: (state: S) => SS,
  options?: AccessorOptions<SS>
): ReturnValue<SS, NormalAccessor<S, Arg, RD, E>>;

export function useSuspenseAccessor<S, Arg, RD, SS, E = unknown>(
  accessor: InfiniteAccessor<S, Arg, RD, E>,
  getSnapshot: (state: S) => SS,
  options?: AccessorOptions<SS>
): ReturnValue<NonNullable<SS>, InfiniteAccessor<S, Arg, RD, E>>;

export function useSuspenseAccessor<S, Arg, RD, SS, E = unknown>(
  accessor: InfiniteAccessor<S, Arg, RD, E> | null,
  getSnapshot: (state: S) => SS,
  options?: AccessorOptions<SS>
): ReturnValue<SS, InfiniteAccessor<S, Arg, RD, E>>;

export function useSuspenseAccessor<Arg, D, E, SS = D | undefined>(
  accessor: NormalAccessor<AutoState, Arg, D, E>,
  options?: AutoAccessorOptions<D, SS>
): ReturnValue<NonNullable<SS>, NormalAccessor<AutoState, Arg, D, E>>;

export function useSuspenseAccessor<Arg, D, E, SS = D | undefined>(
  accessor: NormalAccessor<AutoState, Arg, D, E> | null,
  options?: AutoAccessorOptions<D, SS>
): ReturnValue<SS, NormalAccessor<AutoState, Arg, D, E>>;

export function useSuspenseAccessor<Arg, D, E, SS = D[] | undefined>(
  accessor: InfiniteAccessor<AutoState, Arg, D, E>,
  options?: AutoAccessorOptions<D[], SS>
): ReturnValue<NonNullable<SS>, InfiniteAccessor<AutoState, Arg, D, E>>;

export function useSuspenseAccessor<Arg, D, E, SS = D[] | undefined>(
  accessor: InfiniteAccessor<AutoState, Arg, D, E> | null,
  options?: AutoAccessorOptions<D[], SS>
): ReturnValue<SS, InfiniteAccessor<AutoState, Arg, D, E>>;

export function useSuspenseAccessor<S, D, SS, E = unknown>(
  accessor: Accessor<S, any, D, E> | null,
  maybeGetSnapshot: ((state: S) => SS) | AutoAccessorOptions<D, SS> = {},
  accessorOptions: AccessorOptions<SS> = {}
): ReturnValue<NonNullable<SS>, Accessor<S, any, D, E>> {
  const [getSnapshot, options] = normalizeArgs(accessor, maybeGetSnapshot, accessorOptions);
  const defaultOptions = useContext(accessorOptionsContext);
  const requiredOptions = { ...defaultOptions, ...options };
  const { checkHasData } = requiredOptions;

  if (!accessor) throw new Promise(noop);

  const state = accessor.getState();
  const snapshot = getSnapshot(state);
  const hasData = checkHasData(snapshot);

  if (!hasData) {
    if (accessor.getStatus().isFetching) {
      throw new Promise(noop);
    } else {
      throw accessor.revalidate();
    }
  }

  return {
    data: snapshot as NonNullable<SS>,
    accessor,
  };
}
