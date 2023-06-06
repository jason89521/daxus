import { act, fireEvent, render, screen } from '@testing-library/react';
import { useFetch } from '../lib';
import { createPostModel, getPostModelControl, sleep } from './utils';

describe('useFetch revalidateOnReconnect', () => {
  test('should revalidate when network reconnect', async () => {
    const control = getPostModelControl({});
    const { getPostById, postAdapter } = createPostModel(control);
    function Page() {
      const { data } = useFetch(getPostById(0), model => postAdapter.readOne(model, 0), {
        revalidateOnReconnect: true,
      });

      return <div>title: {data?.title}</div>;
    }

    render(<Page />);
    screen.getByText('title:');
    await screen.findByText('title: title0');
    await act(() => {
      control.titlePrefix = 'online';
      return sleep(10);
    });
    fireEvent.online(window);
    await screen.findByText('title: online title0');
  });

  test('should not revalidate when network reconnect if revalidateOnReconnect is set to false', async () => {
    const control = getPostModelControl({});
    const { getPostById, postAdapter } = createPostModel(control);
    function Page() {
      const { data } = useFetch(getPostById(0), model => postAdapter.readOne(model, 0), {
        revalidateOnReconnect: false,
      });

      return <div>title: {data?.title}</div>;
    }

    render(<Page />);
    screen.getByText('title:');
    await screen.findByText('title: title0');
    await act(() => {
      control.titlePrefix = 'online';
      return sleep(10);
    });
    fireEvent.online(window);
    await act(() => sleep(10));
    await screen.findByText('title: title0');
  });
});
