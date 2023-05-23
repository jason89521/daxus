import { render, screen, fireEvent, act } from '@testing-library/react';
import { createTestItemModel, sleep } from './utils';
import { useState } from 'react';
import { useFetch } from '../lib';

describe('useFetch', () => {
  let { testItemModel, getTestItem } = createTestItemModel();

  beforeEach(() => {
    const utils = createTestItemModel();
    testItemModel = utils.testItemModel;
    getTestItem = utils.getTestItem;
  });

  test('should be able to update the cache', async () => {
    function Page() {
      const [id, setId] = useState(0);
      const { data } = useFetch(getTestItem({ id }), model => model[id]);

      return <div onClick={() => setId(1)}>{data}</div>;
    }

    render(<Page />);
    await screen.findByText('foo/0');
    expect(testItemModel.getModel()[1]).toBeUndefined();
    fireEvent.click(screen.getByText('foo/0'));
    await act(() => sleep(10));

    expect(testItemModel.getModel()[0]).toBe('foo/0');
    expect(testItemModel.getModel()[1]).toBe('foo/1');
  });

  test('should correctly mutate the cached value', async () => {
    function Page() {
      const { data } = useFetch(getTestItem({ id: 0 }), model => model[0]);

      return <div>{data}</div>;
    }

    render(<Page />);
    await screen.findByText('foo/0');
    act(() => testItemModel.mutate(model => (model[0] = 'mutated value')));
    await screen.findByText('mutated value');
  });
});
