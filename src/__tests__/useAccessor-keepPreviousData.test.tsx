import { useState } from 'react';
import { useAccessor } from '../lib';
import { createControl, createPostModel, renderWithOptionsProvider } from './utils';
import { fireEvent } from '@testing-library/react';

let control = createControl({});
let { getPostById, postAdapter } = createPostModel(control);

beforeEach(() => {
  control = createControl({});
  const items = createPostModel(control);
  getPostById = items.getPostById;
  postAdapter = items.postAdapter;
});

describe('useAccessor-normal keepPreviousData', () => {
  test('should keep previous data when accessor change', async () => {
    const loggedData: any[] = [];
    function Page() {
      const [id, setId] = useState(0);
      const accessor = getPostById(id);
      const { data } = useAccessor(accessor, postAdapter.tryReadOneFactory(id), {
        keepPreviousData: true,
      });

      loggedData.push([accessor, data?.title]);

      return <div onClick={() => setId(id + 1)}>{data?.title}</div>;
    }

    const { findByText, getByText } = renderWithOptionsProvider(<Page />);
    await findByText('title0');
    fireEvent.click(getByText('title0'));
    await findByText('title1');

    const [accessor1, accessor2] = [getPostById(0), getPostById(1)];
    expect(loggedData).toEqual([
      [accessor1, undefined],
      [accessor1, 'title0'],
      [accessor2, 'title0'],
      [accessor2, 'title1'],
    ]);
  });
});
