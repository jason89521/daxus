import { usePost } from '../hooks';

interface Props {
  id: number;
  revalidateOnFocus?: boolean;
}

export function Post({ id, revalidateOnFocus }: Props) {
  const { post } = usePost({ id, revalidateOnFocus });

  if (!post) return <div>loading</div>;

  return (
    <div>
      <div>title: {post.title}</div>
      <div>layout: {post.layout}</div>
    </div>
  );
}
