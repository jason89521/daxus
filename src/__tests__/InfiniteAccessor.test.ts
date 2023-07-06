import { defaultOptions } from '../lib/constants.js';
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

  test('should return data from revalidate and fetchNext', async () => {
    expect(await getPostList().revalidate()).toEqual([[page0], null]);
    expect(await getPostList().fetchNext()).toEqual([[page0, page1], null]);
  });

  test('should return error from revalidate and fetchNext', async () => {
    control.fetchDataError = new Error();
    const accessor = getPostList();
    accessor.mount({ optionsRef: { current: { ...defaultOptions, retryCount: 0 } } });
    expect(await accessor.revalidate()).toEqual([null, new Error()]);
    expect(await accessor.fetchNext()).toEqual([null, new Error()]);
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
    expect(result1).toEqual([[page0], null]);
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
    expect(result1).toEqual([[page0], null]);
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
    expect(result1).toEqual([[page0, page1], null]);
    expect(result1).toBe(result2);
  });
});
