import { usePost } from '../hooks';

interface Props {
  id: number;
}

export function Post({ id }: Props) {
  const { post } = usePost({ id });

  if (!post) return <div>loading</div>;

  return (
    <div>
      <div>title: {post.title}</div>
      <div>layout: {post.layout}</div>
    </div>
  );
}
