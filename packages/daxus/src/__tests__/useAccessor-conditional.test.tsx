import { waitFor } from '@testing-library/react';
import { useAccessor } from '../index.js';
import { createControl, createPostModel, renderWithOptionsProvider } from './utils.js';

describe('useAccessor conditional accessor', () => {
  test('should fetch only when accessor is appeared', async () => {
    const fetchDataMock = vi.fn();
    const control = createControl({ fetchDataMock });
    const { getPostById, postAdapter } = createPostModel(control);
    function Page({ id }: { id?: number }) {
      const { data } = useAccessor(id !== undefined ? getPostById(id) : null, (state, id) => {
        return postAdapter.tryReadOne(state, id);
      });

      return <div>title: {data?.title}</div>;
    }

    const { findByText, rerender } = renderWithOptionsProvider(<Page />);
    expect(fetchDataMock).toHaveBeenCalledTimes(0);
    rerender(<Page id={0} />);
    await waitFor(() => {
      expect(fetchDataMock).toHaveBeenCalledTimes(1);
    });
    await findByText('title: title0');
  });
});

describe('useAccessor-infinite conditional accessor', () => {
  test('should fetch only when accessor is appeared', async () => {
    const fetchDataMock = vi.fn();
    const control = createControl({ fetchDataMock });
    const { getPostList, postAdapter } = createPostModel(control);
    function Page({ canFetch }: { canFetch: boolean }) {
      const accessor = canFetch ? getPostList() : null;
      const { data } = useAccessor(accessor, postAdapter.tryReadPaginationFactory(''));

      return <div>{data?.items.map(post => post.title)}</div>;
    }

    const { findByText, rerender } = renderWithOptionsProvider(<Page canFetch={false} />);
    expect(fetchDataMock).toHaveBeenCalledTimes(0);
    rerender(<Page canFetch={true} />);
    await waitFor(() => {
      expect(fetchDataMock).toHaveBeenCalledTimes(1);
    });
    await findByText('title0');
  });
});
