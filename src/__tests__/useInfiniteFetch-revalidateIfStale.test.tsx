import { render, screen } from '@testing-library/react';
import { useInfiniteFetch } from '../lib';
import type { PostModelControl } from './types';
import { createPost, createPostModel } from './utils';

describe('useInfiniteFetch revalidateIfStale', async () => {
  test('should revalidate if there is no stale data', async () => {
    const fetchDataMock = vi.fn();
    const control: PostModelControl = {
      fetchDataMock,
    };
    const { getPostList, postAdapter } = createPostModel(control);
    function Page() {
      const { data } = useInfiniteFetch(getPostList(), model =>
        postAdapter.readPagination(model, '')
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

    render(<Page />);
    screen.getByText('items:');
    await screen.findByText('items: title0');
    expect(fetchDataMock).toHaveBeenCalledTimes(1);
  });

  test('should not revalidate if there is stale data', async () => {
    const fetchDataMock = vi.fn();
    const control: PostModelControl = { fetchDataMock };
    const { getPostList, postAdapter, postModel } = createPostModel(control);
    function Page() {
      const { data } = useInfiniteFetch(
        getPostList(),
        model => postAdapter.readPagination(model, ''),
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

    postModel.mutate(model => {
      postAdapter.replacePagination(model, '', [createPost(0)]);
    });
    render(<Page />);
    screen.getByText('items: title0');
    expect(fetchDataMock).toHaveBeenCalledTimes(0);
  });
});
