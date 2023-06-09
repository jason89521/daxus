import { act, fireEvent, render, screen } from '@testing-library/react';
import { useFetch } from '../lib';
import { createPostModel, getPostModelControl, sleep } from './utils';

describe('useFetch revalidateOnFocus', () => {
  test('should revalidate when window get focused', async () => {
    const control = getPostModelControl({});
    const { getPostById, postAdapter } = createPostModel(control);
    function Page() {
      const { data } = useFetch(getPostById(0), model => postAdapter.tryReadOne(model, 0), {
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
    const control = getPostModelControl({});
    const { getPostById, postAdapter } = createPostModel(control);
    function Page() {
      const { data } = useFetch(getPostById(0), model => postAdapter.tryReadOne(model, 0), {
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
