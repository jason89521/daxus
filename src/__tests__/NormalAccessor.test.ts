import { defaultOptions } from '../lib/constants';
import { createControl, createPost, createPostModel, sleep } from './utils';

let control = createControl({});
let getPostById = createPostModel(control).getPostById;

describe('NormalAccessor', () => {
  beforeEach(() => {
    control = createControl({});
    const model = createPostModel(control);
    getPostById = model.getPostById;
  });

  test('should return data from revalidate', async () => {
    const data = await getPostById(0).revalidate();
    expect(data).toEqual(createPost(0));
  });

  test('should get the same promise if it is a duplicated revalidation', async () => {
    const accessor = getPostById(0);
    const [promise1, promise2] = [accessor.revalidate(), accessor.revalidate()];
    expect(promise1).toBe(promise2);
  });

  test('should get null if it is an expired revalidation', async () => {
    control.sleepTime = 30;
    const accessor = getPostById(0);
    accessor.mount({ optionsRef: { current: { ...defaultOptions, dedupeInterval: 10 } } });
    const promise1 = accessor.revalidate();
    await sleep(10);
    const promise2 = accessor.revalidate();

    expect(await promise1).toBeNull();
    expect(await promise2).toEqual(createPost(0));
  });

  test('should get null if it is aborted when error retry', async () => {
    control.fetchDataError = new Error();
    const accessor = getPostById(0);
    accessor.mount({ optionsRef: { current: { ...defaultOptions, dedupeInterval: 10 } } });
    const promise1 = accessor.revalidate();
    await sleep(10);
    control.fetchDataError = undefined;
    const promise2 = accessor.revalidate();

    expect(await promise1).toBeNull();
    expect(await promise2).toEqual(createPost(0));
  });
});
