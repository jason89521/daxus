import { defaultOptions } from '../constants.js';
import { createControl, createPost, createPostModel, sleep } from './utils.js';

let control = createControl({});
let getPostById = createPostModel(control).getPostById;

describe('Accessor', () => {
  beforeEach(() => {
    control = createControl({});
    const model = createPostModel(control);
    getPostById = model.getPostById;
  });

  test('should return data from revalidate', async () => {
    const result = await getPostById(0).revalidate();
    expect(result).toEqual([null, createPost(0)]);
  });

  test('should return error from revalidate', async () => {
    control.fetchDataError = new Error();
    const accessor = getPostById(0);
    accessor.mount({ optionsRef: { current: { ...defaultOptions, retryCount: 0 } } });
    const result = await accessor.revalidate();
    expect(result).toEqual([new Error()]);
    expect(result.length).toBe(1);
  });

  test('should get the same promise if it is a duplicated revalidation', async () => {
    const accessor = getPostById(0);
    const [promise1, promise2] = [accessor.revalidate(), accessor.revalidate()];
    expect(promise1).toBe(promise2);
  });

  test('should get the same result if it is an expired revalidation', async () => {
    control.sleepTime = 30;
    const accessor = getPostById(0);
    accessor.mount({ optionsRef: { current: { ...defaultOptions, dedupeInterval: 5 } } });
    const promise1 = accessor.revalidate();
    await sleep(10);
    const promise2 = accessor.revalidate();
    const result1 = await promise1;
    const result2 = await promise2;

    expect(promise1).not.toBe(promise2);
    expect(result1).toEqual([null, createPost(0)]);
    expect(result1).toBe(result2);
  });

  test('should get the same result if it is aborted when error retry', async () => {
    control.fetchDataError = new Error();
    const accessor = getPostById(0);
    accessor.mount({ optionsRef: { current: { ...defaultOptions, dedupeInterval: 5 } } });
    const promise1 = accessor.revalidate();
    await sleep(10);
    control.fetchDataError = undefined;
    const promise2 = accessor.revalidate();
    const result1 = await promise1;
    const result2 = await promise2;

    expect(promise1).not.toBe(promise2);
    expect(result1).toEqual([null, createPost(0)]);
    expect(result1).toBe(result2);
  });
});
