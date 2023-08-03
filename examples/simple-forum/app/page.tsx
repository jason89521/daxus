'use client';

import { getPostPaginationKey, listPost } from '@/modules/post/accessorCreator';
import PostEntry from '@/modules/post/components/PostEntry';
import { postAdapter } from '@/modules/post/model';
import { useAccessor } from 'daxus';

export default function Page() {
  const { data, accessor } = useAccessor(
    listPost({}),
    postAdapter.tryReadPaginationFactory(getPostPaginationKey({}))
  );

  return (
    <div>
      {data?.items.map(post => {
        return <PostEntry key={post.id} post={post} />;
      })}
      <div>
        <button
          onClick={() => {
            accessor.fetchNext();
          }}
        >
          fetch next page
        </button>
      </div>
    </div>
  );
}
