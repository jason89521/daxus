import { NextResponse } from 'next/server';
import { posts } from '../instance';

export async function GET(req: Request, { params }: { params: { postId: string } }) {
  const { postId } = params;
  const post = posts.find(post => post.id === postId);

  if (!post) {
    return NextResponse.json(
      { error: `post with id ${postId} is not found` },
      {
        status: 404,
      }
    );
  }

  return NextResponse.json(post, { status: 200 });
}

export async function PUT(req: Request, { params }: { params: { postId: string } }) {
  const { postId } = params;
  const post = posts.find(post => post.id === postId);

  if (!post) {
    return NextResponse.json(
      {
        error: `post with id ${postId} is not found`,
      },
      { status: 404 }
    );
  }

  post.likeCount += 1;

  return NextResponse.json(post, { status: 200 });
}
