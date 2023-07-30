import { defaultOptions } from '../constants.js';
import { createControl, createPost, createPostModel, sleep } from './utils.js';

let control = createControl({});
let getPostList = createPostModel(control).getPostList;
const page0 = [createPost(0)];
const page1 = [createPost(1)];

describe('InfiniteAccessor', () => {
  beforeEach(() => {
    control = createControl({});
    const model = createPostModel(control);
    getPostList = model.getPostList;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('should return data from revalidate and fetchNext', async () => {
    expect(await getPostList().revalidate()).toEqual([null, [page0]]);
    expect(await getPostList().fetchNext()).toEqual([null, [page0, page1]]);
  });

  test('should return error from revalidate and fetchNext', async () => {
    control.fetchDataError = new Error();
    const accessor = getPostList();
    accessor.mount({ optionsRef: { current: { ...defaultOptions, retryCount: 0 } } });
    expect(await accessor.revalidate()).toEqual([new Error()]);
    expect(await accessor.fetchNext()).toEqual([new Error()]);
  });

  test('should get the same promise if it is a duplicated revalidation', async () => {
    const [promise1, promise2] = [getPostList().revalidate(), getPostList().revalidate()];
    expect(promise1).toBe(promise2);
  });

  test('should get the same result if it is an expired revalidation', async () => {
    control.sleepTime = 30;
    const accessor = getPostList();
    accessor.mount({ optionsRef: { current: { ...defaultOptions, dedupeInterval: 5 } } });
    const promise1 = accessor.revalidate();
    await sleep(10);
    const promise2 = accessor.revalidate();
    const result1 = await promise1;
    const result2 = await promise2;

    expect(promise1).not.toBe(promise2);
    expect(result1).toEqual([null, [page0]]);
    expect(result1).toBe(result2);
  });

  test('should get the same result if it is aborted when error retry', async () => {
    control.fetchDataError = new Error();
    const accessor = getPostList();
    accessor.mount({ optionsRef: { current: { ...defaultOptions, dedupeInterval: 5 } } });
    const promise1 = accessor.revalidate();
    await sleep(10);
    control.fetchDataError = undefined;
    const promise2 = accessor.revalidate();
    const result1 = await promise1;
    const result2 = await promise2;

    expect(promise1).not.toBe(promise2);
    expect(result1).toEqual([null, [page0]]);
    expect(result1).toBe(result2);
  });

  test('fetchNext should interrupt revalidate', async () => {
    const accessor = getPostList();
    await accessor.revalidate();
    control.sleepTime = 30;
    const promise1 = accessor.revalidate();
    const promise2 = accessor.fetchNext();
    const [result1, result2] = await Promise.all([promise1, promise2]);

    expect(promise1).not.toBe(promise2);
    expect(result1).toEqual([null, [page0, page1]]);
    expect(result1).toBe(result2);
  });

  test('should record the number of the previous fetched pages after accessor cache is deleted', async () => {
    vi.useFakeTimers();
    const oldAccessor = getPostList();
    await oldAccessor.revalidate();
    await oldAccessor.fetchNext();
    vi.runOnlyPendingTimers();
    // the cache should be deleted from the model
    const newAccessor = getPostList();

    expect(oldAccessor).not.toBe(newAccessor);

    await newAccessor.revalidate();

    expect(newAccessor.getPageNum()).toBe(2);
  });

  test('should set the page number when context is specified', async () => {
    const accessor = getPostList();
    await accessor.revalidate();
    await accessor.fetchNext();

    const result = await accessor.revalidate({ pageNum: 1 });
    expect(result).toEqual([null, [page0]]);
  });
});
