import { useState } from 'react';
import { useAccessor } from '../../lib/index.js';
import { postAdapter, getPostList } from '../model/index.js';
import type { PostLayout } from '../../types.js';

export function PostList() {
  const [layout, setLayout] = useState<PostLayout>('classic');
  const key = JSON.stringify({ layout });
  const accessor = getPostList({ layout });
  const { data } = useAccessor(accessor, state => {
    return postAdapter.tryReadPagination(state, key);
  });

  const loadMore = () => {
    if (data?.noMore) return;
    accessor.fetchNext();
    accessor.fetchNext();
  };

  return (
    <div style={{ borderTop: '1px solid black', marginTop: '20px' }}>
      <div>current layout: {layout}</div>
      <button
        onClick={() => {
          if (layout === 'classic') setLayout('image');
          else setLayout('classic');
        }}
      >
        toggle layout
      </button>
      <button onClick={loadMore} disabled={data?.noMore}>
        fetch next page
      </button>
      {data?.items.map(post => {
        return (
          <div key={post.id}>
            <div>
              title: {post.title}, layout: {post.layout}
            </div>
          </div>
        );
      })}
    </div>
  );
}
