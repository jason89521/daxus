import type { AccessorOptions } from '../../lib/hooks/types';
import { usePost } from '../hooks';

interface Props extends AccessorOptions {
  id: number;
}

export function Post(props: Props) {
  const { post } = usePost(props);

  if (!post) return <div>loading</div>;

  return (
    <div>
      <div>title: {post.title}</div>
      <div>layout: {post.layout}</div>
    </div>
  );
}
