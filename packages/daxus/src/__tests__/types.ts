import type { Post } from '../types.js';

export type Func = (...args: any[]) => Post | undefined | null;

export interface PostModelControl {
  sleepTime?: number;
  titlePrefix?: string;
  fetchDataError?: Error;
  fetchDataMock?: Func;
  onSuccessMock?: Func;
  onErrorMock?: Func;
}
