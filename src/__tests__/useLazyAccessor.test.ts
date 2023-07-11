import { act, renderHook, waitFor } from '@testing-library/react';
import { createLazyModel, useLazyAccessor } from '../lib/index.js';

let model = createLazyModel();

beforeEach(() => {
  model = createLazyModel();
});

describe('lazyModel', () => {
  test('should mutate the data correctly', () => {
    const getData = model.defineNormalAccessor<void, string>({
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

describe('useLazyAccessor - normal', () => {
  test('should return correct data', async () => {
    const getData = model.defineNormalAccessor<void, string>({
      fetchData: async () => {
        return 'data';
      },
    });
    const { result } = renderHook(() => useLazyAccessor(getData()));

    await waitFor(() => {
      expect(result.current.data).toBe('data');
    });
  });

  test('should return selected data', async () => {
    const getData = model.defineNormalAccessor<void, string>({
      fetchData: async () => {
        return 'data';
      },
    });
    const { result } = renderHook(() => useLazyAccessor(getData(), data => data?.length));

    await waitFor(() => {
      expect(result.current.data).toBe(4);
    });
  });
});

describe('useLazyAccessor - infinite', () => {
  test('should return correct data', async () => {
    const getData = model.defineInfiniteAccessor<void, string[]>({
      fetchData: async () => {
        return ['data'];
      },
    });
    const { result } = renderHook(() => useLazyAccessor(getData()));

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
    const getData = model.defineInfiniteAccessor<void, string[]>({
      fetchData: async () => {
        return ['data'];
      },
    });
    const { result } = renderHook(() =>
      useLazyAccessor(
        getData(),
        data => {
          return (data ?? []).flat();
        },
        { revalidateOnMount: true }
      )
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
