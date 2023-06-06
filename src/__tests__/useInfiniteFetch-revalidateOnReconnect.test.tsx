import { act, fireEvent, render, screen } from '@testing-library/react';
import { useInfiniteFetch } from '../lib';
import { createPostModel, getPostModelControl, sleep } from './utils';

describe('useInfiniteFetch revalidateOnReconnect', () => {
  test('should revalidate when network reconnect', async () => {
    const control = getPostModelControl({ titlePrefix: 'online' });
    const { getPostList, postAdapter } = createPostModel(control);
    function Page() {
      const { data, fetchNextPage } = useInfiniteFetch(
        getPostList(),
        model => postAdapter.readPagination(model, ''),
        { revalidateOnReconnect: true }
      );

      return (
        <div>
          items: {data?.items.map(item => item.title).join(' ')}
          <button onClick={() => fetchNextPage()}>next</button>
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
    const control = getPostModelControl({ titlePrefix: 'online' });
    const { getPostList, postAdapter } = createPostModel(control);
    function Page() {
      const { data, fetchNextPage } = useInfiniteFetch(
        getPostList(),
        model => postAdapter.readPagination(model, ''),
        { revalidateOnReconnect: false }
      );

      return (
        <div>
          items: {data?.items.map(item => item.title).join(' ')}
          <button onClick={() => fetchNextPage()}>next</button>
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
