import { useAccessor } from '../lib';
import { act, render, screen } from '@testing-library/react';
import { createPostModel, createPostModelControl, sleep } from './utils';

describe('useAccessor-normal dedupeInterval', () => {
  test('should sync model with the data from the latest request', async () => {
    const control = createPostModelControl({ sleepTime: 100 });
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
