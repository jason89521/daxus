import { defaultOptions } from '../lib/constants';
import { createControl, createPost, createPostModel, sleep } from './utils';

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
    expect(await getPostList().revalidate()).toEqual([[createPost(0)]]);
    expect(await getPostList().fetchNext()).toEqual([page0, page1]);
  });

  test('should get the same promise if it is a duplicated revalidation', async () => {
    const [promise1, promise2] = [getPostList().revalidate(), getPostList().revalidate()];
    expect(promise1).toBe(promise2);
  });

  test('should get null if it is an expired revalidation', async () => {
    control.sleepTime = 30;
    const accessor = getPostList();
    accessor.mount({ optionsRef: { current: { ...defaultOptions, dedupeInterval: 10 } } });
    const promise1 = accessor.revalidate();
    await sleep(10);
    const promise2 = accessor.revalidate();

    expect(await promise1).toBeNull();
    expect(await promise2).toEqual([page0]);
  });

  test('should get null if it is aborted when error retry', async () => {
    control.fetchDataError = new Error();
    const accessor = getPostList();
    accessor.mount({ optionsRef: { current: { ...defaultOptions, dedupeInterval: 10 } } });
    const promise1 = accessor.revalidate();
    await sleep(10);
    control.fetchDataError = undefined;
    const promise2 = accessor.revalidate();

    expect(await promise1).toBeNull();
    expect(await promise2).toEqual([page0]);
  });

  test('fetchNext should interrupt revalidate', async () => {
    const accessor = getPostList();
    await accessor.revalidate();
    control.sleepTime = 30;
    const promise1 = accessor.revalidate();
    const promise2 = accessor.fetchNext();

    expect(await promise1).toBeNull();
    expect(await promise2).toEqual([page0, page1]);
  });
});
