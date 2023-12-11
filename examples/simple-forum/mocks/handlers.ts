import { http } from 'msw';
import { posts } from './instance';
import type { Post } from '@/type';

const PAGE_SIZE = 10;

export const handlers = [
  http.get('/api/post', ({ request }) => {
    const { searchParams } = new URL(request.url);
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

    return new Response(JSON.stringify(result), { status: 200 });
  }),

  http.get('/api/post/:postId', async ({ params }) => {
    const { postId } = params;
    const post = posts.find(post => post.id === postId);

    if (!post) {
      return new Response(null, { status: 404 });
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    return new Response(JSON.stringify(post), { status: 200 });
  }),

  http.put('/api/post/:postId', ({ params }) => {
    const { postId } = params;
    const post = posts.find(post => post.id === postId);

    if (!post) {
      return new Response(null, { status: 404 });
    }

    post.likeCount += 1;
    return new Response(JSON.stringify(post), { status: 200 });
  }),
];
