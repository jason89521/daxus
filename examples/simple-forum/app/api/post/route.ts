import type { Post } from '@/type';
import { posts } from './instance';
import { NextResponse } from 'next/server';

const PAGE_SIZE = 10;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const layout = searchParams.get('layout');
  const forumId = searchParams.get('forumId');
  const page = Number(searchParams.get('page') ?? 0);

  let temp = posts.map(({ content, ...post }) => {
    return post;
  });
  if (layout !== null) {
    temp = temp.filter(post => post.layout === layout);
  }
  if (forumId !== null) {
    temp = temp.filter(post => post.forumId === forumId);
  }

  const pages: Post[][] = [];
  const length = Math.ceil(temp.length / PAGE_SIZE);
  for (let i = 0; i < length; i++) {
    const start = i * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    pages.push(temp.slice(start, end));
  }

  const result = pages[page];

  return NextResponse.json(result);
}
