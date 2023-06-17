import { render, screen } from '@testing-library/react';
import { useAccessor } from '../lib';
import type { PostModelControl } from './types';
import { createPost, createPostModel } from './utils';

describe('useAccessor-normal revalidateIfStale', async () => {
  test('should revalidate if there is no stale data', async () => {
    const fetchDataMock = vi.fn();
    const control: PostModelControl = {
      fetchDataMock,
    };
    const { getPostById, postAdapter } = createPostModel(control);
    function Page() {
      const { data } = useAccessor(getPostById(0), postAdapter.tryReadOneFactory(0));

      return <div>title: {data?.title}</div>;
    }

    render(<Page />);
    screen.getByText('title:');
    await screen.findByText('title: title0');
    expect(fetchDataMock).toHaveBeenCalledTimes(1);
  });

  test('should not revalidate if there is stale data', async () => {
    const fetchDataMock = vi.fn();
    const control: PostModelControl = { fetchDataMock };
    const { getPostById, postAdapter, postModel } = createPostModel(control);
    function Page() {
      const { data } = useAccessor(getPostById(0), postAdapter.tryReadOneFactory(0), {
        revalidateIfStale: false,
      });

      return <div>title: {data?.title}</div>;
    }

    postModel.mutate(state => {
      postAdapter.createOne(state, createPost(0));
    });
    render(<Page />);
    screen.getByText('title: title0');
    expect(fetchDataMock).toHaveBeenCalledTimes(0);
  });
});
