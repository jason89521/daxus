export type PostLayout = 'classic' | 'image';

export interface Post {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  likeCount: number;
  forumId: string;
  layout: PostLayout;
}
