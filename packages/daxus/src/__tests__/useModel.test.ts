import { createControl, createPost, createPostModel } from './utils.js';
import { useModel } from '../index.js';
import { act, renderHook } from '@testing-library/react';

describe('useModel', () => {
  test('should rerender when the snapshot changes', () => {
    const control = createControl({});
    const { postModel, postAdapter } = createPostModel(control);
    const { result } = renderHook(() => useModel(postModel, postAdapter.tryReadOneFactory(0)));

    expect(result.current).toBeUndefined();
    act(() => {
      postModel.mutate(draft => {
        postAdapter.upsertOne(draft, createPost(0));
      });
    });
    expect(result.current).toEqual(createPost(0));
    const post = result.current;
    act(() => {
      postModel.mutate(draft => {
        postAdapter.upsertOne(draft, createPost(0));
      });
    });
    // Should not change the reference if the data is the same.
    expect(post).toBe(result.current);
  });
});
