import { useState } from 'react';
import { createPostModel, createControl, render, sleep } from './utils';
import { useAccessor } from '../lib';
import { fireEvent, waitFor, act } from '@testing-library/react';

describe('useAccessor-infinite pollingInterval', () => {
  test('should keep revalidating if pollingInterval is larger than 0, and stop if it is smaller than 0', async () => {
    const onSuccessMock = vi.fn();
    const control = createControl({ onSuccessMock });
    const { getPostList, postAdapter } = createPostModel(control);
    function Page() {
      const [pollingInterval, setPollingInterval] = useState(10);
      const { data } = useAccessor(
        getPostList(),
        state => postAdapter.tryReadPagination(state, ''),
        { pollingInterval }
      );

      return (
        <div>
          {data?.items.map(item => (
            <div key={item.id}>{item.title}</div>
          ))}
          <button onClick={() => setPollingInterval(0)}>stop</button>
        </div>
      );
    }

    const { getByText, findByText } = render(<Page />);
    await findByText('title0');
    expect(onSuccessMock).toHaveBeenCalledTimes(1);
    await waitFor(
      () => {
        expect(onSuccessMock).toHaveBeenCalledTimes(2);
      },
      { interval: 1 }
    );
    fireEvent.click(getByText('stop'));
    await act(() => sleep(10));
    expect(onSuccessMock).toHaveBeenCalledTimes(2);
  });

  test('should stop polling revalidation if fetchNextPage is invoked', async () => {
    const onSuccessMock = vi.fn();
    const control = createControl({ onSuccessMock });
    const { getPostList, postAdapter } = createPostModel(control);
    function Page() {
      const accessor = getPostList();
      const { data } = useAccessor(accessor, state => postAdapter.tryReadPagination(state, ''), {
        pollingInterval: 10,
      });

      return (
        <div>
          {data?.items.map(item => (
            <div key={item.id}>{item.title}</div>
          ))}
          <button onClick={() => accessor.fetchNext()}>next</button>
        </div>
      );
    }

    const { getByText, findByText } = render(<Page />);
    await findByText('title0');
    expect(onSuccessMock).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText('next'));
    await findByText('title1');
    expect(onSuccessMock).toHaveBeenCalledTimes(2);
  });
});
