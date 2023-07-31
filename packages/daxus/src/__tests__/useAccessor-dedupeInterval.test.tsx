import { useAccessor } from '../index.js';
import { act, render, screen } from '@testing-library/react';
import { createPostModel, createControl, sleep } from './utils.js';

describe('useAccessor dedupeInterval', () => {
  test('should sync state with the data from the latest request', async () => {
    const control = createControl({ sleepTime: 100 });
    const { postAdapter, getPostById } = createPostModel(control);
    const accessor = getPostById(0);
    function Page() {
      const { data } = useAccessor(getPostById(0), postAdapter.tryReadOneFactory(0), {
        dedupeInterval: 10,
      });

      return <div>{data?.title}</div>;
    }

    render(<Page />);
    await act(() => sleep(10));
    await act(() => accessor.revalidate());

    await screen.findByText('title0');

    await act(() => sleep(100));
    await screen.findByText('title0');
  });
});
