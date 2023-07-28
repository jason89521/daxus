import { screen, waitFor } from '@testing-library/react';
import { useAccessor } from '../index.js';
import type { PostModelControl } from './types.js';
import { createPost, createPostModel, renderWithOptionsProvider } from './utils.js';

describe('useAccessor-infinite revalidateOnMount', () => {
  test('should always revalidate if revalidateOnMount is true', async () => {
    const fetchDataMock = vi.fn();
    const control: PostModelControl = {
      fetchDataMock,
    };
    const { getPostList, postAdapter, postModel } = createPostModel(control);
    function Page() {
      const { data } = useAccessor(
        getPostList(),
        state => postAdapter.tryReadPagination(state, ''),
        { revalidateOnMount: true }
      );

      return (
        <div>
          items:{' '}
          {data?.items.map(item => {
            return item.title;
          })}
        </div>
      );
    }

    postModel.mutate(draft => {
      postAdapter.replacePagination(draft, '', [createPost(0)]);
    });
    renderWithOptionsProvider(<Page />);
    screen.getByText('items: title0');
    await waitFor(
      () => {
        expect(fetchDataMock).toHaveBeenCalledTimes(1);
      },
      { interval: 1 }
    );
  });

  test('should not revalidate if there is data and revalidateOnMount is false', async () => {
    const fetchDataMock = vi.fn();
    const control: PostModelControl = { fetchDataMock };
    const { getPostList, postAdapter, postModel } = createPostModel(control);
    function Page() {
      const { data } = useAccessor(
        getPostList(),
        state => postAdapter.tryReadPagination(state, ''),
        { revalidateOnMount: false }
      );

      return (
        <div>
          items:{' '}
          {data?.items.map(item => {
            return item.title;
          })}
        </div>
      );
    }

    postModel.mutate(draft => {
      postAdapter.replacePagination(draft, '', [createPost(0)]);
    });
    renderWithOptionsProvider(<Page />);
    screen.getByText('items: title0');
    expect(fetchDataMock).toHaveBeenCalledTimes(0);
  });
});
