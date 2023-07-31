import { act, fireEvent, renderHook, waitFor } from '@testing-library/react';
import { useAccessor } from '../index.js';
import { createPostModel, createControl, renderWithOptionsProvider, sleep } from './utils.js';
import { useState } from 'react';

describe('useAccessor pollingInterval', () => {
  test('should keep fetching data if pollingInterval is larger than 0, and stop fetching if it is smaller than 0', async () => {
    const onSuccessMock = vi.fn();
    const control = createControl({ onSuccessMock });
    const { getPostById, postAdapter } = createPostModel(control);
    function Page() {
      const [pollingInterval, setPollingInterval] = useState(60);
      const { data } = useAccessor(getPostById(0), postAdapter.tryReadOneFactory(0), {
        pollingInterval,
      });

      return <div onClick={() => setPollingInterval(0)}>title: {data?.title}</div>;
    }

    const { findByText, getByText } = renderWithOptionsProvider(<Page />);
    await findByText('title: title0');
    expect(onSuccessMock).toHaveBeenCalledTimes(1);
    await waitFor(
      () => {
        expect(onSuccessMock).toHaveBeenCalledTimes(2);
      },
      { interval: 1 }
    );
    fireEvent.click(getByText('title: title0'));
    await act(() => sleep(10));
    expect(onSuccessMock).toHaveBeenCalledTimes(2);
  });

  test('should change the interval when the hook unmount', async () => {
    const onSuccessMock = vi.fn();
    const control = createControl({ onSuccessMock });
    const { getPostById, postAdapter } = createPostModel(control);
    function Post({ pollingInterval }: { pollingInterval: number }) {
      const { data } = useAccessor(getPostById(0), postAdapter.tryReadOneFactory(0), {
        pollingInterval,
      });

      return <div>title: {data?.title}</div>;
    }
    function Page() {
      const [showFirst, setShowFirst] = useState(true);

      return (
        <>
          <button onClick={() => setShowFirst(false)}>hide</button>
          {showFirst && <Post pollingInterval={60} />}
          <Post pollingInterval={0} />
        </>
      );
    }

    const { getByText, findAllByText } = renderWithOptionsProvider(<Page />);
    await findAllByText('title: title0');
    expect(onSuccessMock).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText('hide'));
    await act(() => sleep(20));
    expect(onSuccessMock).toHaveBeenCalledTimes(1);
  });

  test('should start polling when pollingInterval changes', async () => {
    const onSuccessMock = vi.fn();
    const control = createControl({ onSuccessMock });
    const { getPostById, postAdapter } = createPostModel(control);
    function Page() {
      const [pollingInterval, setPollingInterval] = useState(0);
      const { data } = useAccessor(getPostById(0), postAdapter.tryReadOneFactory(0), {
        pollingInterval,
      });

      return (
        <>
          <button onClick={() => setPollingInterval(60)}>start polling</button>
          <div>title: {data?.title}</div>
        </>
      );
    }

    const { getByText, findByText } = renderWithOptionsProvider(<Page />);
    await findByText('title: title0');
    expect(onSuccessMock).toHaveBeenCalledOnce();
    await act(() => sleep(100));
    fireEvent.click(getByText('start polling'));
    await waitFor(
      () => {
        expect(onSuccessMock).toHaveBeenCalledTimes(2);
      },
      { interval: 1 }
    );
    await waitFor(
      () => {
        expect(onSuccessMock).toHaveBeenCalledTimes(3);
      },
      { interval: 1 }
    );
  });

  test('should stop background polling if document.visibilityState is hidden', async () => {
    const onSuccessMock = vi.fn();
    const control = createControl({ onSuccessMock });
    const { getPostById, postAdapter } = createPostModel(control);
    renderHook(() =>
      useAccessor(getPostById(0), postAdapter.tryReadOneFactory(0), {
        pollingInterval: 10,
      })
    );

    await waitFor(
      () => {
        expect(onSuccessMock).toHaveBeenCalledTimes(1);
      },
      { interval: 1 }
    );
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    fireEvent(document, new Event('visibilitychange'));
    await sleep(30);
    expect(onSuccessMock).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    fireEvent(document, new Event('visibilitychange'));
    await waitFor(
      () => {
        expect(onSuccessMock).toHaveBeenCalledTimes(2);
      },
      { interval: 1 }
    );
  });

  test('should keep polling if pollingWhenHidden is set to true', async () => {
    const onSuccessMock = vi.fn();
    const control = createControl({ onSuccessMock });
    const { getPostById, postAdapter } = createPostModel(control);
    renderHook(() =>
      useAccessor(getPostById(0), postAdapter.tryReadOneFactory(0), {
        pollingInterval: 10,
        pollingWhenHidden: true,
      })
    );

    await waitFor(
      () => {
        expect(onSuccessMock).toHaveBeenCalledTimes(1);
      },
      { interval: 1 }
    );
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    fireEvent(document, new Event('visibilitychange'));
    await waitFor(
      () => {
        expect(onSuccessMock).toHaveBeenCalledTimes(2);
      },
      { interval: 1 }
    );
  });
});
