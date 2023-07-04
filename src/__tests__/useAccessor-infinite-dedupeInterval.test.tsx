import { useAccessor } from '../lib/index.js';
import type { PostModelControl } from './types.js';
import { createPost, createPostModel, sleep } from './utils.js';
import { render, act, screen } from '@testing-library/react';

describe('useAccessor-infinite dedupeInterval', () => {
  test('should sync state with the data from the latest request', async () => {
    const control: PostModelControl = { sleepTime: 100, titlePrefix: 'with sleep' };
    const { postAdapter, postModel, getPostList } = createPostModel(control);
    function Page() {
      const accessor = getPostList();
      const { data } = useAccessor(
        getPostList(),
        state => postAdapter.tryReadPagination(state, ''),
        { dedupeInterval: 10 }
      );

      return (
        <div>
          {data?.items.map(post => {
            return <div key={post.id}>{post.title}</div>;
          })}
          <button onClick={() => accessor.fetchNext()}>load more</button>
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
    expect(postAdapter.tryReadPagination(postModel.getState(), '')?.items).toEqual([post]);

    // The expired request should not update the state
    await act(() => sleep(100));
    await screen.findByText(post.title);
    expect(postAdapter.tryReadPagination(postModel.getState(), '')?.items).toEqual([post]);
  });
});
