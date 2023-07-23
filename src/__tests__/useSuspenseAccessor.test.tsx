import { Suspense, useState } from 'react';
import { useSuspenseAccessor } from '../lib/index.js';
import { createControl, createPostModel, renderWithOptionsProvider } from './utils.js';
import { fireEvent } from '@testing-library/react';
import { isUndefined } from '../lib/utils/isUndefined.js';

describe('useSuspenseAccessor-normal', () => {
  test('should show the data when fetching finish', async () => {
    const control = createControl({});
    const { getPostById, postAdapter } = createPostModel(control);
    function Post() {
      const { data } = useSuspenseAccessor(getPostById(0), postAdapter.tryReadOneFactory(0));

      return <div>{data.title}</div>;
    }
    function Page() {
      return (
        <Suspense fallback="loading">
          <Post />
        </Suspense>
      );
    }

    const { getByText, findByText } = renderWithOptionsProvider(<Page />);
    getByText('loading');
    await findByText('title0');
  });

  test('should work when accessor changes', async () => {
    const control = createControl({});
    const { getPostById, postAdapter } = createPostModel(control);
    function Post({ id }: { id: number }) {
      const { data } = useSuspenseAccessor(getPostById(id), postAdapter.tryReadOneFactory(id));

      return <div>{data.title}</div>;
    }
    function Page() {
      const [id, setId] = useState(0);

      return (
        <>
          <button onClick={() => setId(id + 1)}>next</button>
          <Suspense fallback="loading">
            <Post id={id} />
          </Suspense>
        </>
      );
    }

    const { getByText, findByText } = renderWithOptionsProvider(<Page />);
    getByText('loading');
    await findByText('title0');

    fireEvent.click(getByText('next'));
    getByText('loading');
    await findByText('title1');
  });

  test('should work with conditional fetching', async () => {
    const control = createControl({});
    const { getPostById, postAdapter } = createPostModel(control);
    function Post({ id }: { id: number | undefined }) {
      const { data } = useSuspenseAccessor(
        isUndefined(id) ? null : getPostById(id),
        postAdapter.tryReadOneFactory(id!)
      );

      return <div>{data?.title}</div>;
    }
    function Page() {
      const [id, setId] = useState<number | undefined>();

      return (
        <>
          <button onClick={() => setId(0)}>next</button>
          <Suspense fallback="loading">
            <Post id={id} />
          </Suspense>
        </>
      );
    }

    const { getByText, findByText } = renderWithOptionsProvider(<Page />);
    getByText('loading');
    fireEvent.click(getByText('next'));
    await findByText('title0');
  });
});
