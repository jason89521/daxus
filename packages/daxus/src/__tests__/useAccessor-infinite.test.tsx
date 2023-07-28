import { fireEvent, render, screen, act, waitFor } from '@testing-library/react';
import { useAccessor } from '../index.js';
import { createPost, createPostModel, createControl, sleep } from './utils.js';
import type { PostModelControl } from './types.js';

describe('useAccessor-infinite', () => {
  test('should be able to update the cache', async () => {
    const { getPostList, postAdapter } = createPostModel({});
    function Page() {
      const accessor = getPostList();
      const { data } = useAccessor(accessor, state => postAdapter.tryReadPagination(state, ''));

      return (
        <div>
          items: {data?.items.map(item => item.title)}
          <button onClick={() => accessor.fetchNext()}>next</button>
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
      const accessor = getPostList();
      const { data } = useAccessor(accessor, state => postAdapter.tryReadPagination(state, ''));

      return (
        <div>
          items: {data?.items.map(item => item.title)}
          <button onClick={() => accessor.fetchNext()}>next</button>
        </div>
      );
    }

    render(<Page />);
    screen.getByText('items:');
    await screen.findByText('items: title0');
    act(() => postModel.mutate(state => postAdapter.updateOne(state, 0, { title: 'mutated' })));
    await screen.findByText('items: mutated');
    fireEvent.click(screen.getByText('next'));
    await screen.findByText('items: mutatedtitle1');
  });

  test('should trigger onSuccess', async () => {
    const onSuccessMock = vi.fn();
    const control: PostModelControl = { onSuccessMock };
    const { getPostList, postAdapter } = createPostModel(control);
    function Page() {
      const accessor = getPostList();
      const { data } = useAccessor(accessor, state => postAdapter.tryReadPagination(state, ''));

      return (
        <div>
          items: {data?.items.map(item => item.title)}
          <button onClick={() => accessor.fetchNext()}>next</button>
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
      const accessor = getPostList();
      const { data } = useAccessor(accessor, state => postAdapter.tryReadPagination(state, ''), {
        retryCount: 0,
      });

      return (
        <div>
          items: {data?.items.map(item => item.title)}
          <button onClick={() => accessor.fetchNext()}>next</button>
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

  test('should not cause an unhandled rejection when revalidate', async () => {
    const onErrorMock = vi.fn();
    const control = createControl({ onErrorMock, fetchDataError: new Error('error') });
    const { getPostList, postAdapter } = createPostModel(control);
    function Page() {
      const { data } = useAccessor(getPostList(), postAdapter.tryReadPaginationFactory(''), {
        dedupeInterval: 1,
        retryInterval: 50,
      });
      return <div>items: {data?.items.map(item => item.title)}</div>;
    }

    render(<Page />);
    await act(() => sleep(5));
    // this should not cause an unhandled rejection in test.
    getPostList().revalidate();
    await waitFor(() => expect(onErrorMock).toHaveBeenCalledOnce());
  });
});
