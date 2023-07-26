/**
 * @vitest-environment node
 */

import { createControl, createPost, createPostModel } from './utils.js';

const control = createControl({});

describe('createModel', () => {
  test('should access the same state in the server if server state key is the same', () => {
    const { postModel, postAdapter } = createPostModel(control);
    const serverStateKey = {};
    postModel.mutate(draft => {
      postAdapter.createOne(draft, createPost(0));
    }, serverStateKey);

    const state = postModel.getState(serverStateKey);
    expect(postAdapter.readOne(state, 0)).toEqual(createPost(0));
    // different key should get different state.
    expect(postAdapter.tryReadOne(postModel.getState({}), 0)).toBeUndefined();
  });
});
