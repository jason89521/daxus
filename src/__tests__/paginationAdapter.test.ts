import { beforeEach, describe, expect, test } from 'vitest';
import { createPaginationAdapter } from '../lib';
import type { Post } from './types';

const post = { id: 0, layout: 'image', title: 'title' } as Post;

describe('paginationAdapter', () => {
  let adapter = createPaginationAdapter<Post>({});
  let model = adapter.initialModel;
  beforeEach(() => {
    adapter = createPaginationAdapter({});
    model = adapter.initialModel;
  });

  test('CRUD', () => {
    expect(adapter.readOne(model, 0)).toBeUndefined();

    adapter.createOne(model, { ...post });
    expect(adapter.readOne(model, 0)).toEqual(post);

    adapter.updateOne(model, 0, { layout: 'classic' });
    expect(adapter.readOne(model, 0)).toEqual({ ...post, layout: 'classic' });
    adapter.updateOne(model, 1, { layout: 'classic' });
    expect(adapter.readOne(model, 1)).toBeUndefined();

    adapter.deleteOne(model, 0);
    expect(adapter.readOne(model, 0)).toBeUndefined();

    // create a post
    const post2 = { ...post, id: 2 };
    adapter.upsertOne(model, { ...post2 });
    expect(adapter.readOne(model, 2)).toEqual({ ...post2 });
    // update a post
    adapter.upsertOne(model, { ...post2, layout: 'classic' });
    expect(adapter.readOne(model, 2)).toEqual({ ...post2, layout: 'classic' });
  });

  test('pagination with CRUD', () => {
    const paginationKey = 'testing';

    expect(adapter.readPagination(model, paginationKey)).toBeUndefined();

    const [page0, page1] = (() => {
      const data = new Array(10).fill(0).map((_, index) => {
        return { ...post, id: index };
      });
      return [data.slice(0, 5), data.slice(5)];
    })();
    adapter.replacePagination(model, paginationKey, page0);
    expect(adapter.readPagination(model, paginationKey)).toEqual({
      items: page0,
      noMore: false,
      sizePerPage: 5,
    });
    adapter.appendPagination(model, paginationKey, page1);
    expect(adapter.readPagination(model, paginationKey)).toEqual({
      items: [...page0, ...page1],
      noMore: false,
      sizePerPage: 5,
    });

    adapter.deleteOne(model, 0);
    expect(adapter.readPagination(model, paginationKey)).toEqual({
      items: [...page0.slice(1), ...page1],
      noMore: false,
      sizePerPage: 5,
    });

    adapter.appendPagination(model, paginationKey, [{ ...post }]);
    expect(adapter.readPagination(model, paginationKey)).toEqual({
      items: [...page0.slice(1), ...page1, post],
      noMore: false,
      sizePerPage: 5,
    });
  });
});
