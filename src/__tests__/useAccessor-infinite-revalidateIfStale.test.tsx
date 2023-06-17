import { screen } from '@testing-library/react';
import { useAccessor } from '../lib';
import type { PostModelControl } from './types';
import { createPost, createPostModel, renderWithOptionsProvider } from './utils';

describe('useAccessor-infinite revalidateIfStale', async () => {
  test('should revalidate if there is no stale data', async () => {
    const fetchDataMock = vi.fn();
    const control: PostModelControl = {
      fetchDataMock,
    };
    const { getPostList, postAdapter } = createPostModel(control);
    function Page() {
      const { data } = useAccessor(getPostList(), state =>
        postAdapter.tryReadPagination(state, '')
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

    renderWithOptionsProvider(<Page />);
    screen.getByText('items:');
    await screen.findByText('items: title0');
    expect(fetchDataMock).toHaveBeenCalledTimes(1);
  });

  test('should not revalidate if there is stale data', async () => {
    const fetchDataMock = vi.fn();
    const control: PostModelControl = { fetchDataMock };
    const { getPostList, postAdapter, postModel } = createPostModel(control);
    function Page() {
      const { data } = useAccessor(
        getPostList(),
        state => postAdapter.tryReadPagination(state, ''),
        { revalidateIfStale: false }
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
