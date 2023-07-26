import { act, render } from '@testing-library/react';
import { useAccessor, useHydrate } from '../lib/index.js';
import type { Post } from '../types.js';
import { createPost, createPostModel, createControl, sleep } from './utils.js';
import { renderToString } from 'react-dom/server';

describe('useHydrate', () => {
  test('should hydrate successfully', async () => {
    const onSuccessMock = vi.fn();
    const updateMock = vi.fn();
    const control = createControl({ onSuccessMock });
    const { getPostById, postAdapter, postModel } = createPostModel(control);
    function Component({ postId }: { postId: number }) {
      const { data } = useAccessor(getPostById(postId), postAdapter.tryReadOneFactory(postId), {
        revalidateIfStale: false,
      });

      return <div>title: {data?.title}</div>;
    }
    function Page({ post }: { post: Post }) {
      useHydrate(post, () => {
        postModel.mutate(draft => {
          postAdapter.createOne(draft, post);
          updateMock();
        });
      });

      return <Component postId={parseInt(post.id)} />;
    }

    let ui = <Page post={createPost(0)} />;
    const container = document.createElement('div');
    document.body.append(container);
    container.innerHTML = renderToString(ui);
    const { getByText, rerender } = render(ui, { container, hydrate: true });

    getByText('title: title0');
    await act(() => sleep(10));
    expect(onSuccessMock).toHaveBeenCalledTimes(0);
    expect(updateMock).toHaveBeenCalledTimes(1);

    ui = <Page post={createPost(1)} />;
    rerender(ui);
    getByText('title: title1');
    await act(() => sleep(10));
    expect(onSuccessMock).toHaveBeenCalledTimes(0);
    expect(updateMock).toHaveBeenCalledTimes(2);
  });
});
