import { render, screen, waitFor } from '@testing-library/react';
import { useAccessor } from '../index.js';
import type { PostModelControl } from './types.js';
import { createPost, createPostModel } from './utils.js';

describe('useAccessor revalidateOnMount', () => {
  test('should always revalidate if revalidateOnMount is true', async () => {
    const fetchDataMock = vi.fn();
    const control: PostModelControl = {
      fetchDataMock,
    };
    const { getPostById, postAdapter, postModel } = createPostModel(control);
    function Page() {
      const { data } = useAccessor(getPostById(0), postAdapter.tryReadOneFactory(0), {
        revalidateOnMount: true,
      });

      return <div>title: {data?.title}</div>;
    }

    postModel.mutate(draft => {
      postAdapter.createOne(draft, createPost(0));
    });
    render(<Page />);
    screen.getByText('title: title0');
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
    const { getPostById, postAdapter, postModel } = createPostModel(control);
    function Page() {
      const { data } = useAccessor(getPostById(0), postAdapter.tryReadOneFactory(0), {
        revalidateOnMount: false,
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
