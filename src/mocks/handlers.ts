import { rest } from 'msw';
import type { Post } from '../types.js';

const TOTAL_POST_NUM = 50;

const posts = new Array(TOTAL_POST_NUM).fill(0).map((_, index) => {
  const id = `${index}`;
  const layout = Math.random() > 0.5 ? 'classic' : 'image';
  const title = `title ${id}`;

  return {
    id,
    layout,
    title,
  } as Post;
});

export const handlers = [
  rest.get('/posts/:postId', (req, res, ctx) => {
    const id = parseInt(req.params.postId as string);
    if (id >= TOTAL_POST_NUM) {
      return res(ctx.status(404));
    }

    return res(ctx.status(200), ctx.json(posts[id]));
  }),

  rest.get('/posts', (req, res, ctx) => {
    const searchParams = req.url.searchParams;
    const limit = parseInt(searchParams.get('limit') ?? '5');
    const page = parseInt(searchParams.get('page') ?? '0');
    const layout = searchParams.get('layout');
    const result = (() => {
      if (layout) {
        const totalSkipNum = page * limit;
        let skippedNum = 0;
        const result: Post[] = [];
        posts.forEach(post => {
          if (post.layout !== layout) return;
          if (skippedNum < totalSkipNum) {
            skippedNum += 1;
            return;
          }
          if (result.length === limit) return;
          result.push(post);
        });

        return result;
      }

      const startIndex = page * limit;
      const endIndex = startIndex + limit;
      return posts.slice(startIndex, endIndex);
    })();

    return res(ctx.status(200), ctx.json(result));
  }),
];
