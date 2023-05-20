import { useState } from 'react';
import { useInfiniteFetch } from '../lib';
import { postAdapter, getPostList } from '../model';
import type { PostLayout } from '../types';

export function PostList() {
  const [layout, setLayout] = useState<PostLayout>('classic');
  const { data, fetchNextPage } = useInfiniteFetch(getPostList({ layout }), model => {
    const key = JSON.stringify({ layout });
    return postAdapter.getPagination(model, key);
  });

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
      <button onClick={() => fetchNextPage()}>fetch next page</button>
      {data.map(post => {
        return (
          <div key={post.id}>
            <div>title: {post.title}</div>
          </div>
        );
      })}
    </div>
  );
}
