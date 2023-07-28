import { createPaginationAdapter } from '../index.js';
import type { Post } from '../types.js';
import { createPost } from './utils.js';

describe('paginationAdapter', () => {
  const post0 = createPost(0);
  let adapter = createPaginationAdapter<Post>({});
  let state = adapter.initialState;
  beforeEach(() => {
    adapter = createPaginationAdapter({});
    state = adapter.initialState;
  });

  test('CRUD', () => {
    expect(adapter.tryReadOne(state, 0)).toBeUndefined();
    expect(adapter.tryReadOneFactory(0)(state)).toBeUndefined();
    expect(() => adapter.readOne(state, 0)).toThrowError();

    adapter.createOne(state, { ...post0 });
    expect(adapter.tryReadOne(state, 0)).toEqual(post0);
    expect(adapter.tryReadOneFactory(0)(state)).toEqual(post0);
    expect(adapter.readOne(state, 0)).toEqual(post0);

    adapter.updateOne(state, 0, { layout: 'image' });

    expect(adapter.tryReadOne(state, 0)).toEqual({ ...post0, layout: 'image' });
    expect(adapter.tryReadOneFactory(0)(state)).toEqual({ ...post0, layout: 'image' });
    expect(adapter.readOne(state, 0)).toEqual({ ...post0, layout: 'image' });

    adapter.updateOne(state, 1, { layout: 'classic' });
    expect(adapter.tryReadOne(state, 1)).toBeUndefined();
    expect(adapter.tryReadOneFactory(1)(state)).toBeUndefined();
    expect(() => adapter.readOne(state, 1)).toThrowError();

    adapter.deleteOne(state, 0);
    expect(adapter.tryReadOne(state, 0)).toBeUndefined();
    expect(adapter.tryReadOneFactory(0)(state)).toBeUndefined();
    expect(() => adapter.readOne(state, 1)).toThrowError();

    // create a post
    const post1 = createPost(1);
    adapter.upsertOne(state, { ...post1 });
    expect(adapter.tryReadOne(state, 1)).toEqual({ ...post1 });
    expect(adapter.readOne(state, 1)).toEqual({ ...post1 });
    // update a post
    adapter.upsertOne(state, { ...post1, layout: 'image' });
    expect(adapter.tryReadOne(state, 1)).toEqual({ ...post1, layout: 'image' });
    expect(adapter.readOne(state, 1)).toEqual({ ...post1, layout: 'image' });
  });

  test('pagination with CRUD', () => {
    const key = 'testing';

    expect(adapter.tryReadPagination(state, key)).toBeUndefined();

    const [page0, page1] = (() => {
      const data = new Array(10).fill(0).map((_, index) => {
        return createPost(index);
      });
      return [data.slice(0, 5), data.slice(5)];
    })();
    adapter.replacePagination(state, key, page0);
    expect(adapter.tryReadPagination(state, key)).toEqual({
      items: page0,
      noMore: false,
    });
    adapter.appendPagination(state, key, page1);
    expect(adapter.tryReadPagination(state, key)).toEqual({
      items: [...page0, ...page1],
      noMore: false,
    });

    adapter.deleteOne(state, 0);
    expect(adapter.tryReadPagination(state, key)).toEqual({
      items: [...page0.slice(1), ...page1],
      noMore: false,
    });

    adapter.appendPagination(state, key, [{ ...post0 }]);
    expect(adapter.tryReadPagination(state, key)).toEqual({
      items: [...page0.slice(1), ...page1, post0],
      noMore: false,
    });

    const post10 = createPost(10);
    adapter.prependPagination(state, key, [post10]);
    expect(adapter.tryReadPagination(state, key)?.items).toEqual([
      post10,
      ...page0.slice(1),
      ...page1,
      post0,
    ]);

    adapter.setNoMore(state, key, true);
    expect(adapter.readPaginationMeta(state, key).noMore).toBe(true);
  });

  test('should transform rawData to data', () => {
    type NewPost = Post & { content: string };
    const adapter = createPaginationAdapter<NewPost, Post>({
      transform: rawPost => {
        return { ...rawPost, content: 'content' };
      },
    });
    const state = adapter.initialState;

    adapter.createOne(state, createPost(0));
    expect(adapter.readOne(state, 0)).toEqual({ ...post0, content: 'content' });
    adapter.deleteOne(state, 0);
    expect(adapter.tryReadOne(state, 0)).toBeUndefined();

    adapter.upsertOne(state, createPost(0));
    expect(adapter.readOne(state, 0)).toEqual({ ...post0, content: 'content' });
    adapter.deleteOne(state, 0);
    expect(adapter.tryReadOne(state, 0)).toBeUndefined();

    adapter.appendPagination(state, '', [createPost(0)]);
    expect(adapter.readOne(state, 0)).toEqual({ ...post0, content: 'content' });
    adapter.deleteOne(state, 0);
    expect(adapter.tryReadOne(state, 0)).toBeUndefined();

    adapter.prependPagination(state, '', [createPost(0)]);
    expect(adapter.readOne(state, 0)).toEqual({ ...post0, content: 'content' });
    adapter.deleteOne(state, 0);
    expect(adapter.tryReadOne(state, 0)).toBeUndefined();
  });

  test('should sort the pagination correctly', () => {
    const key = '';
    adapter.prependPagination(state, key, [createPost(0), createPost(2), createPost(1)]);
    adapter.sortPagination(state, key, (a, b) => {
      return parseInt(a.id) - parseInt(b.id);
    });

    expect(adapter.readPaginationMeta(state, key).ids).toEqual(['0', '1', '2']);
  });
});
