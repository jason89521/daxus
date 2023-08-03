'use client';

import { useAccessor } from 'daxus';
import { useState } from 'react';
import { getPost } from '@/modules/post/accessorCreator';
import { postAdapter, postModel } from '@/modules/post/model';
import Link from 'next/link';
import { getPostIndex } from '@/utils';

export default function Page({ params }: { params: { postId: string } }) {
  const { postId } = params;
  const { data, error } = useAccessor(
    getPost(postId),
    state => {
      return postAdapter.tryReadOne(state, postId);
    },
    {
      checkHasData: post => typeof post?.content !== 'undefined',
    }
  );

  const [isLoading, setIsLoading] = useState(false);

  if (!data && error) {
    return <div>Not found</div>;
  }

  return (
    <div>
      <h1>{data?.title}</h1>
      <p>{data?.content ? data.content : data?.excerpt}</p>
      <div>
        <button
          onClick={async () => {
            if (isLoading) return;
            postModel.mutate(draft => {
              postAdapter.readOne(draft, data!.id).likeCount += 1;
            });
            setIsLoading(true);
            try {
              await (await fetch(`/api/post/${data!.id}`, { method: 'PUT' })).json();
            } catch (error) {
              postModel.mutate(draft => {
                postAdapter.readOne(draft, data!.id).likeCount -= 1;
              });
            } finally {
              setIsLoading(false);
            }
          }}
        >
          Like {data?.likeCount}
        </button>
      </div>
      <div>
        <Link href={`./postId_${getPostIndex(postId) - 1}`}>Previous Post</Link>
        <br />
        <Link href={`./postId_${getPostIndex(postId) + 1}`}>Next Post</Link>
      </div>
    </div>
  );
}
