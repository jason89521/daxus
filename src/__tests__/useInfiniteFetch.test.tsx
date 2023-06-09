import { fireEvent, render, screen, act } from '@testing-library/react';
import { useInfiniteFetch } from '../lib';
import { createPost, createPostModel, sleep } from './utils';
import type { PostModelControl } from './types';

describe('useInfiniteFetch', () => {
  test('should be able to update the cache', async () => {
    const { getPostList, postAdapter } = createPostModel({});
    function Page() {
      const { data, fetchNextPage } = useInfiniteFetch(getPostList(), model =>
        postAdapter.tryReadPagination(model, '')
      );

      return (
        <div>
          items: {data?.items.map(item => item.title)}
          <button onClick={() => fetchNextPage()}>next</button>
        </div>
      );
    }

    render(<Page />);
    screen.getByText('items:');
    await screen.findByText('items: title0');
    fireEvent.click(screen.getByText('next'));
    await screen.findByText('items: title0title1');
  });

  test('should correctly mutate the cached value', async () => {
    const { getPostList, postAdapter, postModel } = createPostModel({});
    function Page() {
      const { data, fetchNextPage } = useInfiniteFetch(getPostList(), model =>
        postAdapter.tryReadPagination(model, '')
      );

      return (
        <div>
          items: {data?.items.map(item => item.title)}
          <button onClick={() => fetchNextPage()}>next</button>
        </div>
      );
    }

    render(<Page />);
    screen.getByText('items:');
    await screen.findByText('items: title0');
    act(() => postModel.mutate(model => postAdapter.updateOne(model, 0, { title: 'mutated' })));
    await screen.findByText('items: mutated');
    fireEvent.click(screen.getByText('next'));
    await screen.findByText('items: mutatedtitle1');
  });

  test('should trigger onSuccess', async () => {
    const onSuccessMock = vi.fn();
    const control: PostModelControl = { onSuccessMock };
    const { getPostList, postAdapter } = createPostModel(control);
    function Page() {
      const { data, fetchNextPage } = useInfiniteFetch(getPostList(), model =>
        postAdapter.tryReadPagination(model, '')
      );

      return (
        <div>
          items: {data?.items.map(item => item.title)}
          <button onClick={() => fetchNextPage()}>next</button>
        </div>
      );
    }

    render(<Page />);
    screen.getByText('items:');
    await screen.findByText('items: title0');
    expect(onSuccessMock).toHaveBeenCalledTimes(1);
    expect(onSuccessMock).toHaveBeenCalledWith({ data: [[createPost(0)]], arg: undefined });
    fireEvent.click(screen.getByText('next'));
    await screen.findByText('items: title0title1');
    expect(onSuccessMock).toHaveBeenCalledTimes(2);
    expect(onSuccessMock).toHaveBeenCalledWith({
      data: [[createPost(0)], [createPost(1)]],
      arg: undefined,
    });
  });

  test('should trigger OnError', async () => {
    const onErrorMock = vi.fn();
    const control: PostModelControl = { onErrorMock, fetchDataError: new Error('error 0') };
    const { getPostList, postAdapter } = createPostModel(control);
    function Page() {
      const { data, fetchNextPage } = useInfiniteFetch(
        getPostList(),
        model => postAdapter.tryReadPagination(model, ''),
        { retryCount: 0 }
      );

      return (
        <div>
          items: {data?.items.map(item => item.title)}
          <button onClick={() => fetchNextPage()}>next</button>
        </div>
      );
    }

    render(<Page />);
    screen.getByText('items:');
    await act(() => sleep(10));
    expect(onErrorMock).toHaveBeenCalledTimes(1);
    expect(onErrorMock).toHaveBeenCalledWith({ error: new Error('error 0'), arg: undefined });
    act(() => (control.fetchDataError = new Error('error 1')));
    fireEvent.click(screen.getByText('next'));
    await act(() => sleep(10));
    expect(onErrorMock).toHaveBeenCalledTimes(2);
    expect(onErrorMock).toHaveBeenCalledWith({
      error: new Error('error 1'),
      arg: undefined,
    });
  });
});
