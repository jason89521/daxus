import { createPaginationAdapter } from '../lib';
import type { Post } from './types';
import { createPost } from './utils';

describe('paginationAdapter', () => {
  const post0 = createPost(0);
  let adapter = createPaginationAdapter<Post>({});
  let model = adapter.initialModel;
  beforeEach(() => {
    adapter = createPaginationAdapter({});
    model = adapter.initialModel;
  });

  test('CRUD', () => {
    expect(adapter.readOne(model, 0)).toBeUndefined();

    adapter.createOne(model, { ...post0 });
    expect(adapter.readOne(model, 0)).toEqual(post0);

    adapter.updateOne(model, 0, { layout: 'image' });
    expect(adapter.readOne(model, 0)).toEqual({ ...post0, layout: 'image' });
    adapter.updateOne(model, 1, { layout: 'classic' });
    expect(adapter.readOne(model, 1)).toBeUndefined();

    adapter.deleteOne(model, 0);
    expect(adapter.readOne(model, 0)).toBeUndefined();

    // create a post
    const post1 = createPost(1);
    adapter.upsertOne(model, { ...post1 });
    expect(adapter.readOne(model, 1)).toEqual({ ...post1 });
    // update a post
    adapter.upsertOne(model, { ...post1, layout: 'image' });
    expect(adapter.readOne(model, 1)).toEqual({ ...post1, layout: 'image' });
  });

  test('pagination with CRUD', () => {
    const paginationKey = 'testing';

    expect(adapter.readPagination(model, paginationKey)).toBeUndefined();

    const [page0, page1] = (() => {
      const data = new Array(10).fill(0).map((_, index) => {
        return createPost(index);
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

    adapter.appendPagination(model, paginationKey, [{ ...post0 }]);
    expect(adapter.readPagination(model, paginationKey)).toEqual({
      items: [...page0.slice(1), ...page1, post0],
      noMore: false,
      sizePerPage: 5,
    });
  });
});