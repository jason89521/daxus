import { produce } from 'immer';
import { createPaginationState } from '../index.js';
import type { Post } from '../types.js';
import { createPost } from './utils.js';

describe('createPaginationState', () => {
  test('should correctly create/read/update/delete entity', () => {
    let state = createPaginationState<Post>();

    state = produce(state, draft => {
      draft.upsertOne(createPost(0));
    });
    expect(state.tryReadOne(0)).toEqual(createPost(0));

    state = produce(state, draft => {
      draft.deleteOne(0);
    });
    expect(state.tryReadOne(0)).toBeUndefined();

    state = produce(state, draft => {
      draft.upsertOne(createPost(0));
    });
    expect(state.readOne(0)).toEqual(createPost(0));

    state = produce(state, draft => {
      draft.updateOne(0, { title: 'update' });
    });
    expect(state.readOne(0).title).toBe('update');

    state = produce(state, draft => {
      draft.deleteOne(0);
      draft.upsertMany([createPost(0), createPost(1)]);
    });
    expect(state.readOne(0)).toEqual(createPost(0));
    expect(state.readOne(1)).toEqual(createPost(1));
  });

  test('should correctly create/read/update/delete pagination', () => {
    const key = '';
    let state = createPaginationState<Post, Post, { isEnded?: boolean }>();

    state = produce(state, draft => {
      draft.replacePagination(key, [createPost(1)]);
    });
    expect(state.readPagination(key)).toEqual({
      data: [createPost(1)],
      ids: ['1'],
      meta: {},
    });

    // append
    state = produce(state, draft => {
      draft.appendPagination(key, [createPost(2)]);
    });
    expect(state.readPagination(key)).toEqual({
      data: [createPost(1), createPost(2)],
      ids: ['1', '2'],
      meta: {},
    });

    // prepend
    state = produce(state, draft => {
      draft.prependPagination(key, [createPost(3)]);
    });
    expect(state.readPagination(key)).toEqual({
      data: [createPost(3), createPost(1), createPost(2)],
      ids: ['3', '1', '2'],
      meta: {},
    });

    // sorting
    state = produce(state, draft => {
      draft.sortPagination(key, (a, b) => +a.id - +b.id);
    });
    expect(state.readPagination(key)).toEqual({
      data: [createPost(1), createPost(2), createPost(3)],
      ids: ['1', '2', '3'],
      meta: {},
    });

    // update meta
    state = produce(state, draft => {
      draft.updatePagination(key, { meta: { isEnded: true } });
    });
    expect(state.readPagination(key).meta).toEqual({
      isEnded: true,
    });
  });
});
