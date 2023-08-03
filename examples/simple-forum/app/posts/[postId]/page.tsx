import PostPage from '@/modules/post/components/PostPage';

export default async function Page({ params }: { params: { postId: string } }) {
  const { postId } = params;

  return (
    <div>
      <PostPage postId={postId} />
    </div>
  );
}
