import { useFetch } from '../lib';
import { act, render, screen } from '@testing-library/react';
import { createTestItemModel, sleep } from './utils';

describe('useFetch dedupeInterval', () => {
  test('should sync model with the data from the latest request', async () => {
    let shouldSleep = true;
    const { testItemModel, getTestItem } = createTestItemModel({
      fetchData: async () => {
        if (shouldSleep) {
          shouldSleep = false;
          await sleep(100);
          return 'data with sleep';
        }

        return 'data';
      },
    });
    function Page() {
      const { data } = useFetch(getTestItem(0), model => model[0], {
        dedupeInterval: 10,
      });

      return <div>{data}</div>;
    }

    render(<Page />);
    await act(() => sleep(10));
    await act(() => getTestItem(0).revalidate());

    await screen.findByText('data');
    expect(testItemModel.getModel()[0]).toBe('data');

    await act(() => sleep(100));
    await screen.findByText('data');
    expect(testItemModel.getModel()[0]).toBe('data');
  });
});
