export type PostLayout = 'classic' | 'image';

export interface Post {
  id: number;
  title: string;
  layout: PostLayout;
}

export type Func = (...args: any[]) => any;

export interface PostModelControl {
  sleepTime?: number;
  titlePrefix?: string;
  fetchDataMock?: Func;
}
