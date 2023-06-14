export type PostLayout = 'classic' | 'image';

export interface Post {
  id: string;
  title: string;
  layout: PostLayout;
}
