import { act, fireEvent, render, screen } from '@testing-library/react';
import { createPostModel, createControl, sleep } from './utils';
import { useAccessor } from '../lib';

describe('useAccessor-infinite revalidateOnReconnect', () => {
  test('should revalidate when network reconnect', async () => {
    const control = createControl({ titlePrefix: 'online' });
    const { getPostList, postAdapter } = createPostModel(control);
    function Page() {
      const accessor = getPostList();
      const { data } = useAccessor(accessor, model => postAdapter.tryReadPagination(model, ''), {
        revalidateOnReconnect: true,
      });

      return (
        <div>
          items: {data?.items.map(item => item.title).join(' ')}
          <button onClick={() => accessor.fetchNext()}>next</button>
        </div>
      );
    }

    render(<Page />);
    screen.getByText('items:');
    await screen.findByText('items: online title0');
    act(() => (control.titlePrefix = ''));
    fireEvent.online(window);
    await screen.findByText('items: title0');
    fireEvent.click(screen.getByText('next'));
    await screen.findByText('items: title0 title1');
  });

  test('should not revalidate when network reconnect if revalidateOnReconnect is set to false', async () => {
    const control = createControl({ titlePrefix: 'online' });
    const { getPostList, postAdapter } = createPostModel(control);
    function Page() {
      const accessor = getPostList();
      const { data } = useAccessor(accessor, model => postAdapter.tryReadPagination(model, ''), {
        revalidateOnReconnect: false,
      });

      return (
        <div>
          items: {data?.items.map(item => item.title).join(' ')}
          <button onClick={() => accessor.fetchNext()}>next</button>
        </div>
      );
    }

    render(<Page />);
    screen.getByText('items:');
    await screen.findByText('items: online title0');
    act(() => (control.titlePrefix = ''));
    fireEvent.online(window);
    await act(() => sleep(10));
    screen.getByText('items: online title0');
    fireEvent.click(screen.getByText('next'));
    await screen.findByText('items: online title0 title1');
  });
});
