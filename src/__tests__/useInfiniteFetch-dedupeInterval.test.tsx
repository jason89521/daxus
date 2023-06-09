import { useInfiniteFetch } from '../lib';
import type { PostModelControl } from './types';
import { createPost, createPostModel, sleep } from './utils';
import { render, act, screen } from '@testing-library/react';

describe('useInfiniteFetch dedupeInterval', () => {
  test('should sync model with the data from the latest request', async () => {
    const control: PostModelControl = { sleepTime: 100, titlePrefix: 'with sleep' };
    const { postAdapter, postModel, getPostList } = createPostModel(control);
    function Page() {
      const { data, fetchNextPage } = useInfiniteFetch(
        getPostList(),
        model => postAdapter.tryReadPagination(model, ''),
        { dedupeInterval: 10 }
      );

      return (
        <div>
          {data?.items.map(post => {
            return <div>{post.title}</div>;
          })}
          <button onClick={() => fetchNextPage()}>load more</button>
        </div>
      );
    }

    render(<Page />);
    await act(() => sleep(10));
    await act(() => {
      control.sleepTime = 0;
      control.titlePrefix = 'without sleep';
      return getPostList().revalidate();
    });

    const post = createPost(0);
    post.title = `${control.titlePrefix} ${post.title}`;
    await screen.findByText(post.title);
    expect(postAdapter.tryReadPagination(postModel.getModel(), '')?.items).toEqual([post]);

    // The expired request should not update the model
    await act(() => sleep(100));
    await screen.findByText(post.title);
    expect(postAdapter.tryReadPagination(postModel.getModel(), '')?.items).toEqual([post]);
  });
});
