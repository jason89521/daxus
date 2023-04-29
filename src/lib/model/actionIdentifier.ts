import type { NormalAction, InfiniteAction } from './types';

type NormalActionIdentifier<M, Arg, RD> = {
  type: 'normal';
  action: NormalAction<M, Arg, RD>;
};

type InfiniteActionIdentifier<M, Arg, RD> = {
  type: 'infinite';
  action: InfiniteAction<M, Arg, RD>;
};

export type ActionIdentifier<M, Arg = any, RD = any> =
  | NormalActionIdentifier<M, Arg, RD>
  | InfiniteActionIdentifier<M, Arg, RD>;

export function createNormalActionIdentifier<M, Arg, RD>(
  action: NormalAction<M, Arg, RD>
): NormalActionIdentifier<M, Arg, RD> {
  return {
    type: 'normal',
    action,
  };
}

export function createInfiniteActionIdentifier<M, Arg, RD>(
  action: InfiniteAction<M, Arg, RD>
): InfiniteActionIdentifier<M, Arg, RD> {
  return {
    type: 'infinite',
    action,
  };
}
