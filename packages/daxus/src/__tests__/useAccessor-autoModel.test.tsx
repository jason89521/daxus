import { act, fireEvent, renderHook, waitFor } from '@testing-library/react';
import { createAutoModel, useAccessor } from '../lib/index.js';
import { renderWithOptionsProvider } from './utils.js';

let model = createAutoModel();

beforeEach(() => {
  model = createAutoModel();
});

describe('autoModel', () => {
  test('should mutate the data correctly', () => {
    const getData = model.defineNormalAccessor<string>({
      name: 'getData',
      fetchData: async () => {
        return 'data';
      },
    });
    model.mutate(getData(), prevData => {
      return prevData ? 'has data' : 'no data';
    });

    expect(model.getState(getData())).toBe('no data');
    model.mutate(getData(), prevData => {
      return prevData ? 'has data' : 'no data';
    });

    expect(model.getState(getData())).toBe('has data');
  });
});

describe('useAccessor - normal with auto state', () => {
  test('should return correct data', async () => {
    const getData = model.defineNormalAccessor<string>({
      name: 'getData',
      fetchData: async () => {
        return 'data';
      },
    });
    const { result } = renderHook(() => useAccessor(getData()));

    await waitFor(() => {
      expect(result.current.data).toBe('data');
    });
  });

  test('should return selected data', async () => {
    const getData = model.defineNormalAccessor<string>({
      name: 'getData',
      fetchData: async () => {
        return 'data';
      },
    });
    const { result } = renderHook(() =>
      useAccessor(getData(), {
        getSnapshot: data => data?.length,
      })
    );

    await waitFor(() => {
      expect(result.current.data).toBe(4);
    });
  });

  test('should notify accessor itself only', async () => {
    let notifiedCount = 0;
    const getStaticData = model.defineNormalAccessor<string>({
      name: 'getStaticData',
      fetchData: async () => {
        return 'static';
      },
    });
    const getDynamicData = model.defineNormalAccessor<string>({
      name: 'getDynamicData',
      fetchData: async () => {
        return `${notifiedCount}`;
      },
    });

    function StaticComponent() {
      const { data } = useAccessor(getStaticData(), {
        getSnapshot: data => {
          notifiedCount += 1;
          return data;
        },
      });

      return <div>{data}</div>;
    }

    function DynamicComponent() {
      const { accessor, data } = useAccessor(getDynamicData());

      return (
        <div>
          {data}
          <button onClick={() => accessor.revalidate()}>rerender</button>
        </div>
      );
    }

    function Page() {
      return (
        <div>
          <StaticComponent />
          <DynamicComponent />
        </div>
      );
    }

    const { findByText, getByText } = renderWithOptionsProvider(<Page />);
    await findByText('static');
    expect(notifiedCount).toBe(2);
    fireEvent.click(getByText('rerender'));
    await findByText('2');

    expect(notifiedCount).toBe(2); // should not be notified
  });
});

describe('useAccessor - infinite with auto state', () => {
  test('should return correct data', async () => {
    const getData = model.defineInfiniteAccessor<string[]>({
      name: 'getData',
      fetchData: async () => {
        return ['data'];
      },
    });
    const { result } = renderHook(() => useAccessor(getData()));

    await waitFor(() => {
      expect(result.current.data).toEqual([['data']]);
    });

    await act(() => result.current.accessor.fetchNext());
    await waitFor(() => {
      expect(result.current.data).toEqual([['data'], ['data']]);
    });

    // should return the same result
    await act(() => getData().revalidate());
    await waitFor(() => {
      expect(result.current.data).toEqual([['data'], ['data']]);
    });
  });

  test('should return selected data', async () => {
    const getData = model.defineInfiniteAccessor<string[]>({
      name: 'getData',
      fetchData: async () => {
        return ['data'];
      },
    });
    const { result } = renderHook(() =>
      useAccessor(getData(), {
        revalidateOnMount: true,
        getSnapshot: data => {
          return (data ?? []).flat();
        },
      })
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(['data']);
    });

    await act(() => result.current.accessor.fetchNext());
    await waitFor(() => {
      expect(result.current.data).toEqual(['data', 'data']);
    });

    // should return the same result
    await act(() => getData().revalidate());
    await waitFor(() => {
      expect(result.current.data).toEqual(['data', 'data']);
    });
  });
});
