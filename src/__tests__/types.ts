export type PostLayout = 'classic' | 'image';

export interface Post {
  id: number;
  title: string;
  layout: PostLayout;
}

export type Func = (...args: any[]) => any;
