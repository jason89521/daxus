import { renderHook, waitFor } from '@testing-library/react';
import { createPostModel } from './utils.js';
import { useAccessor } from '../lib/index.js';

describe('useAccessor placeholderData', () => {
  test('should get the placeholder data', async () => {
    const { getPostById, postAdapter } = createPostModel({});
    const { result } = renderHook(() =>
      useAccessor(getPostById(0), postAdapter.tryReadOneFactory(0), {
        placeholderData: { id: '0', title: 'placeholder', layout: 'classic' },
      })
    );

    expect(result.current.data?.title).toBe('placeholder');
    await waitFor(() => {
      expect(result.current.data?.title).toBe('title0');
    });
  });
});
