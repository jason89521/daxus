import { act, fireEvent, render, screen } from '@testing-library/react';
import { useAccessor } from '../index.js';
import { createPostModel, createControl, sleep } from './utils.js';

describe('useAccessor revalidateOnFocus', () => {
  test('should revalidate when window get focused', async () => {
    const control = createControl({});
    const { getPostById, postAdapter } = createPostModel(control);
    function Page() {
      const { data } = useAccessor(getPostById(0), postAdapter.tryReadOneFactory(0), {
        revalidateOnFocus: true,
      });

      return <div>title: {data?.title}</div>;
    }

    render(<Page />);
    screen.getByText('title:');
    await screen.findByText('title: title0');
    await act(() => {
      control.titlePrefix = 'focus';
      return sleep(10);
    });
    fireEvent.focus(window);
    await screen.findByText('title: focus title0');
  });

  test('should not revalidate when window get focused if revalidateOnFocus is set to false', async () => {
    const control = createControl({});
    const { getPostById, postAdapter } = createPostModel(control);
    function Page() {
      const { data } = useAccessor(getPostById(0), postAdapter.tryReadOneFactory(0), {
        revalidateOnFocus: false,
      });

      return <div>title: {data?.title}</div>;
    }

    render(<Page />);
    screen.getByText('title:');
    await screen.findByText('title: title0');
    await act(() => {
      control.titlePrefix = 'focus';
      return sleep(10);
    });
    fireEvent.focus(window);
    await act(() => sleep(10));
    await screen.findByText('title: title0');
  });
});
