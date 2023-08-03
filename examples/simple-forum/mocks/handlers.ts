import { rest } from 'msw';
import { posts } from './instance';
import type { Post } from '@/type';

const PAGE_SIZE = 10;

export const handlers = [
  rest.get('/api/post', (req, res, ctx) => {
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

    return res(ctx.status(200), ctx.json(result));
  }),

  rest.get('/api/post/:postId', (req, res, ctx) => {
    const { postId } = req.params;
    const post = posts.find(post => post.id === postId);

    if (!post) {
      return res(ctx.status(404));
    }

    return res(ctx.status(200), ctx.json(post));
  }),

  rest.put('/api/post/:postId', (req, res, ctx) => {
    const { postId } = req.params;
    const post = posts.find(post => post.id === postId);

    if (!post) {
      return res(ctx.status(404));
    }

    post.likeCount += 1;

    return res(ctx.status(200), ctx.json(post));
  }),
];
