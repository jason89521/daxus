import { screen, fireEvent, act, waitFor } from '@testing-library/react';
import { createPostModel, createControl, sleep, renderWithOptionsProvider } from './utils.js';
import { useState } from 'react';
import { useAccessor } from '../index.js';

describe('useAccessor-normal', () => {
  test('should be able to update the cache', async () => {
    const control = createControl({});
    const { getPostById, postAdapter } = createPostModel(control);
    function Page() {
      const [id, setId] = useState(0);
      const { data } = useAccessor(getPostById(id), postAdapter.tryReadOneFactory(id));

      return <div onClick={() => setId(1)}>{data?.title}</div>;
    }

    renderWithOptionsProvider(<Page />);
    await screen.findByText('title0');
    fireEvent.click(screen.getByText('title0'));
    await act(() => sleep(10));
    await screen.findByText('title1');
  });

  test('should correctly mutate the cached value', async () => {
    const control = createControl({});
    const { getPostById, postAdapter, postModel } = createPostModel(control);
    function Page() {
      const { data } = useAccessor(getPostById(0), postAdapter.tryReadOneFactory(0));

      return <div>{data?.title}</div>;
    }

    renderWithOptionsProvider(<Page />);
    await screen.findByText('title0');
    act(() => postModel.mutate(draft => (postAdapter.readOne(draft, 0).title = 'mutated value')));
    await screen.findByText('mutated value');
  });

  test('should trigger onSuccess', async () => {
    const onSuccessMock = vi.fn();
    const control = createControl({ onSuccessMock });
    const { getPostById, postAdapter } = createPostModel(control);
    function Page() {
      const [id, setId] = useState(0);
      const { data } = useAccessor(getPostById(id), postAdapter.tryReadOneFactory(id));

      return <div onClick={() => setId(1)}>{data?.title}</div>;
    }

    renderWithOptionsProvider(<Page />);
    await screen.findByText('title0');
    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByText('title0'));
    await act(() => sleep(100));
    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalledTimes(2);
    });
  });

  test('should trigger onError', async () => {
    const onErrorMock = vi.fn();
    const control = createControl({ onErrorMock, fetchDataError: new Error('error') });
    const { getPostById, postAdapter } = createPostModel(control);
    function Page() {
      const [id, setId] = useState(0);
      const { data } = useAccessor(getPostById(id), postAdapter.tryReadOneFactory(id), {
        retryInterval: 10,
      });

      return <div onClick={() => setId(1)}>data: {data?.title}</div>;
    }

    renderWithOptionsProvider(<Page />);
    await screen.findByText('data:');
    await waitFor(() => {
      expect(onErrorMock).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByText('data:'));
    await waitFor(() => {
      expect(onErrorMock).toHaveBeenCalledTimes(2);
    });
  });

  test('should hide the aborting error when any retry is aborted', async () => {
    const onErrorMock = vi.fn();
    const control = createControl({ onErrorMock, fetchDataError: new Error('error') });
    const { getPostById, postAdapter } = createPostModel(control);
    function Page() {
      const { data } = useAccessor(getPostById(0), postAdapter.tryReadOneFactory(0), {
        dedupeInterval: 1,
        retryInterval: 10,
      });
      return <div>data: {data?.title}</div>;
    }

    renderWithOptionsProvider(<Page />);
    await act(() => sleep(5));
    // this should not cause an unhandled rejection in test.
    getPostById(0).revalidate();
    await waitFor(() => expect(onErrorMock).toHaveBeenCalledOnce());
  });
});
