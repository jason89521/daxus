import { waitFor } from '@testing-library/react';
import { useAccessor } from '../lib';
import { createControl, createPost, createPostModel, renderWithOptionsProvider } from './utils';

describe('useAccessor-normal revalidateIfStale', () => {
  test('should revalidate if the data is marked as stale', async () => {
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
    accessor.setIsStale(true);

    const { getByText } = renderWithOptionsProvider(<Page />);
    getByText('title: title0');
    await waitFor(() => {
      expect(fetchDataMock).toHaveBeenCalledTimes(1);
    });

    accessor.setIsStale(true);
    await waitFor(() => {
      expect(fetchDataMock).toHaveBeenCalledTimes(2);
    });

    getPostById.setIsStale(true);
    await waitFor(() => {
      expect(fetchDataMock).toHaveBeenCalledTimes(3);
    });

    postModel.setIsStale(true);
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
    accessor.setIsStale(true);

    const { getByText } = renderWithOptionsProvider(<Page />);
    getByText('title0');
    await waitFor(() => {
      expect(fetchDataMock).toHaveBeenCalledTimes(1);
    });

    accessor.setIsStale(true);
    await waitFor(() => {
      expect(fetchDataMock).toHaveBeenCalledTimes(2);
    });

    getPostList.setIsStale(true);
    await waitFor(() => {
      expect(fetchDataMock).toHaveBeenCalledTimes(3);
    });

    postModel.setIsStale(true);
    await waitFor(() => {
      expect(fetchDataMock).toHaveBeenCalledTimes(4);
    });
  });
});
