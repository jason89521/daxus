'use client';
import type { Post } from '@/type';
import { useState } from 'react';
import { postModel, postAdapter } from '../model';
import Link from 'next/link';

export default function PostEntry({ post }: { post: Post }) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div style={{ border: '1px solid black', padding: '5px 20px', marginBottom: '20px' }}>
      <h2>
        <Link href={`/posts/${post.id}`}>title: {post.title}</Link>
      </h2>
      <div>
        <strong>layout: {post.layout}</strong>
      </div>
      <p>{post.excerpt}</p>
      <button
        style={{ display: 'block', marginBottom: '20px' }}
        onClick={async () => {
          if (isLoading) return;
          postModel.mutate(draft => {
            postAdapter.readOne(draft, post.id).likeCount += 1;
          });
          setIsLoading(true);
          try {
            await (await fetch(`/api/post/${post.id}`, { method: 'PUT' })).json();
          } catch (error) {
            postModel.mutate(draft => {
              postAdapter.readOne(draft, post.id).likeCount += 1;
            });
          } finally {
            setIsLoading(false);
          }
        }}
      >
        Like {post.likeCount}
      </button>
    </div>
  );
}
