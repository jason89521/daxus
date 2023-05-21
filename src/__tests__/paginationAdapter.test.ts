import { beforeEach, describe, expect, test } from 'vitest';
import { createModel, createPaginationAdapter } from '../lib';
import { Post } from '../types';

const post = { id: 1, layout: 'image', title: 'title' } as const;

describe('paginationAdapter', () => {
  let adapter = createPaginationAdapter<Post>({});
  let model = adapter.initialModel;
  beforeEach(() => {
    adapter = createPaginationAdapter({});
    model = adapter.initialModel;
  });

  test('createOne, readOne, updateOne, deleteOne and upsertOne', () => {
    expect(adapter.readOne(model, 1)).toBeUndefined();

    adapter.createOne(model, { ...post });
    expect(adapter.readOne(model, 1)).toEqual(post);

    adapter.updateOne(model, 1, { layout: 'classic' });
    expect(adapter.readOne(model, 1)).toEqual({ ...post, layout: 'classic' });
    adapter.updateOne(model, 2, { layout: 'classic' });
    expect(adapter.readOne(model, 2)).toBeUndefined();

    adapter.deleteOne(model, 1);
    expect(adapter.readOne(model, 1)).toBeUndefined();

    // create a post
    const post2 = { ...post, id: 2 };
    adapter.upsertOne(model, { ...post2 });
    expect(adapter.readOne(model, 2)).toEqual({ ...post2 });
    // update a post
    adapter.upsertOne(model, { ...post2, layout: 'classic' });
    expect(adapter.readOne(model, 2)).toEqual({ ...post2, layout: 'classic' });
  });

  test('updatePagination, getPagination', () => {
    const paginationKey = 'testing';

    expect(adapter.getPagination(model, paginationKey)).toEqual([]);

    const [page0, page1] = (() => {
      const data = new Array(10).fill(0).map((_, index) => {
        return { ...post, id: index + 1 };
      });
      return [data.slice(0, 5), data.slice(5)];
    })();
    adapter.updatePagination(model, { pageIndex: 0, paginationKey, data: page0 });
    expect(adapter.getPagination(model, paginationKey)).toEqual(page0);
    adapter.updatePagination(model, { pageIndex: 1, paginationKey, data: page1 });
    expect(adapter.getPagination(model, paginationKey)).toEqual([...page0, ...page1]);
  });
});
