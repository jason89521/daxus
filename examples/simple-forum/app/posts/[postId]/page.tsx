import PostPage from '@/modules/post/components/PostPage';
import type { Post } from '@/type';
import { baseUrl } from '@/utils';

export default async function Page({ params }: { params: { postId: string } }) {
  const { postId } = params;
  const post: Post = await (
    await fetch(`${baseUrl}/api/post/${postId}`, { cache: 'no-store' })
  ).json();

  return (
    <div>
      <PostPage post={post} />
    </div>
  );
}
