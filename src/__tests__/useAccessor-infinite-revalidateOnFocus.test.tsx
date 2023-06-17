import { act, fireEvent, screen } from '@testing-library/react';
import { useAccessor } from '../lib';
import { createPostModel, createControl, sleep, render } from './utils';

describe('useAccessor-infinite revalidateOnFocus', () => {
  test('should revalidate when window get focused', async () => {
    const control = createControl({ titlePrefix: 'focus' });
    const { getPostList, postAdapter } = createPostModel(control);
    function Page() {
      const accessor = getPostList();
      const { data } = useAccessor(accessor, state => postAdapter.tryReadPagination(state, ''), {
        revalidateOnFocus: true,
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
    await screen.findByText('items: focus title0');
    act(() => (control.titlePrefix = ''));
    fireEvent.focus(window);
    await screen.findByText('items: title0');
    fireEvent.click(screen.getByText('next'));
    await screen.findByText('items: title0 title1');
  });

  test('should not revalidate when window get focused if revalidateOnFocus is set to false', async () => {
    const control = createControl({ titlePrefix: 'focus' });
    const { getPostList, postAdapter } = createPostModel(control);
    function Page() {
      const accessor = getPostList();
      const { data } = useAccessor(accessor, state => postAdapter.tryReadPagination(state, ''), {
        revalidateOnFocus: false,
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
    await screen.findByText('items: focus title0');
    act(() => (control.titlePrefix = ''));
    fireEvent.focus(window);
    await act(() => sleep(10));
    screen.getByText('items: focus title0');
    fireEvent.click(screen.getByText('next'));
    await screen.findByText('items: focus title0 title1');
  });

  test('should fetch next page if revalidation and fetching next page are triggered concurrently', async () => {
    const control = createControl({});
    const { getPostList, postAdapter } = createPostModel(control);
    function Page() {
      const accessor = getPostList();
      const { data } = useAccessor(accessor, state => postAdapter.tryReadPagination(state, ''));

      return (
        <div>
          items: {data?.items.map(item => item.title).join(' ')}
          <button onClick={() => accessor.fetchNext()}>next</button>
        </div>
      );
    }

    render(<Page />);
    screen.getByText('items:');
    await screen.findByText('items: title0');
    act(() => (control.titlePrefix = 'next'));
    fireEvent.focus(window);
    fireEvent.click(screen.getByText('next'));
    await screen.findByText('items: title0 next title1');
  });
});
