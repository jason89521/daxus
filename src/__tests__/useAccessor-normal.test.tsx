import { render, screen, fireEvent, act } from '@testing-library/react';
import { createPostModel, createPostModelControl, sleep } from './utils';
import { useState } from 'react';
import { useAccessor } from '../lib';

describe('useAccessor-normal', () => {
  test('should be able to update the cache', async () => {
    const control = createPostModelControl({});
    const { getPostById, postAdapter } = createPostModel(control);
    function Page() {
      const [id, setId] = useState(0);
      const { data } = useAccessor(getPostById(id), postAdapter.tryReadOneFactory(id));

      return <div onClick={() => setId(1)}>{data?.title}</div>;
    }

    render(<Page />);
    await screen.findByText('title0');
    fireEvent.click(screen.getByText('title0'));
    await act(() => sleep(10));
    await screen.findByText('title1');
  });

  test('should correctly mutate the cached value', async () => {
    const control = createPostModelControl({});
    const { getPostById, postAdapter, postModel } = createPostModel(control);
    function Page() {
      const { data } = useAccessor(getPostById(0), postAdapter.tryReadOneFactory(0));

      return <div>{data?.title}</div>;
    }

    render(<Page />);
    await screen.findByText('title0');
    act(() => postModel.mutate(model => (postAdapter.readOne(model, 0).title = 'mutated value')));
    await screen.findByText('mutated value');
  });

  test('should trigger onSuccess', async () => {
    const onSuccessMock = vi.fn();
    const control = createPostModelControl({ onSuccessMock });
    const { getPostById, postAdapter } = createPostModel(control);
    function Page() {
      const [id, setId] = useState(0);
      const { data } = useAccessor(getPostById(id), postAdapter.tryReadOneFactory(id));

      return <div onClick={() => setId(1)}>{data?.title}</div>;
    }

    render(<Page />);
    await screen.findByText('title0');
    expect(onSuccessMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('title0'));
    await act(() => sleep(100));
    expect(onSuccessMock).toHaveBeenCalledTimes(2);
  });

  test('should trigger onError', async () => {
    const onErrorMock = vi.fn();
    const control = createPostModelControl({ onErrorMock, fetchDataError: new Error('error') });
    const { getPostById, postAdapter } = createPostModel(control);
    function Page() {
      const [id, setId] = useState(0);
      const { data } = useAccessor(getPostById(id), postAdapter.tryReadOneFactory(id), {
        retryInterval: 10,
      });

      return <div onClick={() => setId(1)}>data: {data?.title}</div>;
    }

    render(<Page />);
    await screen.findByText('data:');
    await act(() => sleep(35));
    expect(onErrorMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('data:'));
    await act(() => sleep(35));
    expect(onErrorMock).toHaveBeenCalledTimes(2);
  });
});
