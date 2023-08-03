'use client';

import type { Post } from '@/type';
import { useAccessor, useHydrate } from 'daxus';
import { postAdapter, postModel } from '../model';
import { useState } from 'react';
import { baseUrl, getPostIndex } from '@/utils';
import { getPost } from '../accessorCreator';
import Link from 'next/link';

export default function PostPage({ post }: { post: Post }) {
  useHydrate(post, serverStateKey => {
    postModel.mutate(draft => {
      postAdapter.upsertOne(draft, post);
    }, serverStateKey);
  });

  const { data } = useAccessor(getPost(post.id), state => {
    return postAdapter.readOne(state, post.id);
  });

  const [isLoading, setIsLoading] = useState(false);

  return (
    <div>
      <h1>{data.title}</h1>
      <p>{data.content}</p>
      <div>
        <button
          onClick={async () => {
            if (isLoading) return;
            postModel.mutate(draft => {
              postAdapter.readOne(draft, data.id).likeCount += 1;
            });
            setIsLoading(true);
            try {
              await (await fetch(`${baseUrl}/api/post/${data!.id}`, { method: 'PUT' })).json();
            } catch (error) {
              postModel.mutate(draft => {
                postAdapter.readOne(draft, data.id).likeCount += 1;
              });
            } finally {
              setIsLoading(false);
            }
          }}
        >
          Like {data.likeCount}
        </button>
      </div>
      <div>
        <Link href={`./postId_${getPostIndex(post.id) - 1}`}>Previous Post</Link>
        <br />
        <Link href={`./postId_${getPostIndex(post.id) + 1}`}>Next Post</Link>
      </div>
    </div>
  );
}
