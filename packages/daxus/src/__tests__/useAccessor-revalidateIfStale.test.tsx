import { act, fireEvent, renderHook, waitFor } from '@testing-library/react';
import { useAccessor } from '../index.js';
import {
  createControl,
  createPost,
  createPostModel,
  renderWithOptionsProvider,
  sleep,
} from './utils.js';
import { useState } from 'react';

describe('useAccessor-normal revalidateIfStale', () => {
  test('should revalidate if the accessor is stale', async () => {
    const fetchDataMock = vi.fn();
    const control = createControl({ fetchDataMock });
    const { getPostById, postAdapter } = createPostModel(control);
    function Page() {
      const [id, setId] = useState(0);
      const { data } = useAccessor(getPostById(id), postAdapter.tryReadOneFactory(id), {
        revalidateIfStale: true,
      });

      return (
        <div>
          <button onClick={() => setId(id ? 0 : 1)}>change id</button>
          {data?.title}
        </div>
      );
    }

    const { getByText, findByText } = renderWithOptionsProvider(<Page />);
    await findByText('title0');
    fireEvent.click(getByText('change id'));
    await findByText('title1');
    expect(fetchDataMock).toHaveBeenCalledTimes(2);
    fireEvent.click(getByText('change id'));
    getByText('title0');
    await waitFor(() => {
      expect(fetchDataMock).toHaveBeenCalledTimes(3);
    });
  });

  test('should mark accessor as stale after staleTime', async () => {
    const control = createControl({});
    const { getPostById, postAdapter } = createPostModel(control);
    const { result } = renderHook(() =>
      useAccessor(getPostById(0), postAdapter.tryReadOneFactory(0), { staleTime: 100 })
    );

    expect(result.current.accessor.isStale()).toBe(false);
    await sleep(50);
    expect(result.current.accessor.isStale()).toBe(false);
    await waitFor(() => {
      expect(result.current.accessor.isStale()).toBe(true);
    });

    await act(() => result.current.accessor.revalidate());
    expect(result.current.accessor.isStale()).toBe(false);
    await sleep(50);
    // refetch the data. This action should postpone the stale state being set to true.
    await act(() => result.current.accessor.revalidate());
    await sleep(60);
    expect(result.current.accessor.isStale()).toBe(false);
    await waitFor(() => {
      expect(result.current.accessor.isStale()).toBe(true);
    });
  });

  test('should revalidate if the accessor is invalidated, and it is mounted', async () => {
    const fetchDataMock = vi.fn();
    const control = createControl({ fetchDataMock });
    const { getPostById, postAdapter, postModel } = createPostModel(control);
    const accessor = getPostById(0);
    function Page() {
      const { data } = useAccessor(getPostById(0), postAdapter.tryReadOneFactory(0), {
        revalidateIfStale: true,
      });

      return <div>title: {data?.title}</div>;
    }
    postModel.mutate(draft => {
      postAdapter.createOne(draft, createPost(0));
    });
    accessor.invalidate();

    const { getByText } = renderWithOptionsProvider(<Page />);
    getByText('title: title0');
    await waitFor(() => {
      expect(fetchDataMock).toHaveBeenCalledTimes(1);
    });

    accessor.invalidate();
    await waitFor(() => {
      expect(fetchDataMock).toHaveBeenCalledTimes(2);
    });

    getPostById.invalidate();
    await waitFor(() => {
      expect(fetchDataMock).toHaveBeenCalledTimes(3);
    });

    postModel.invalidate();
    await waitFor(() => {
      expect(fetchDataMock).toHaveBeenCalledTimes(4);
    });
  });
});

describe('useAccessor-infinite revalidateIfStale', () => {
  test('should revalidate if the data is marked as stale', async () => {
    const fetchDataMock = vi.fn();
    const control = createControl({ fetchDataMock });
    const { getPostList, postAdapter, postModel } = createPostModel(control);
    const key = '';
    const accessor = getPostList();
    function Page() {
      const { data } = useAccessor(accessor, postAdapter.tryReadPaginationFactory(key), {
        revalidateIfStale: true,
      });

      return <div>{data?.items.map(post => post.title)}</div>;
    }
    postModel.mutate(draft => {
      postAdapter.appendPagination(draft, key, [createPost(0)]);
    });
    accessor.invalidate();

    const { getByText } = renderWithOptionsProvider(<Page />);
    getByText('title0');
    await waitFor(() => {
      expect(fetchDataMock).toHaveBeenCalledTimes(1);
    });

    accessor.invalidate();
    await waitFor(() => {
      expect(fetchDataMock).toHaveBeenCalledTimes(2);
    });

    getPostList.invalidate();
    await waitFor(() => {
      expect(fetchDataMock).toHaveBeenCalledTimes(3);
    });

    postModel.invalidate();
    await waitFor(() => {
      expect(fetchDataMock).toHaveBeenCalledTimes(4);
    });
  });
});
