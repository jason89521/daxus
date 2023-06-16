export type Func = (...args: any[]) => any;

export interface PostModelControl {
  sleepTime?: number;
  titlePrefix?: string;
  fetchDataError?: Error;
  fetchDataMock?: Func;
  onSuccessMock?: Func;
  onErrorMock?: Func;
}
