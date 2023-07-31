import { defaultOptions } from '../constants.js';
import { createControl, createPostModel } from './utils.js';

const control = createControl({});
const optionsRef = { current: defaultOptions };
let { getPostById, getPostList } = createPostModel(control);

describe('accessorCreator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    const utils = createPostModel(control);
    getPostById = utils.getPostById;
    getPostList = utils.getPostList;
  });

  test('should clear the cache if the accessor is unused', () => {
    const oldAccessor = getPostById(0);
    vi.runOnlyPendingTimers();
    const newAccessor = getPostById(0);

    expect(oldAccessor).not.toBe(newAccessor);
  });

  test('should clear the cache if the infinite accessor is unused', () => {
    const oldAccessor = getPostList();
    vi.runOnlyPendingTimers();
    const newAccessor = getPostList();

    expect(oldAccessor).not.toBe(newAccessor);
  });

  test('should not clear the cache if the accessor is mounted', () => {
    const accessor = getPostById(0);
    const unmountAccessor = accessor.mount({ optionsRef: { ...optionsRef } });
    vi.runOnlyPendingTimers();

    expect(accessor).toBe(getPostById(0));
    vi.runOnlyPendingTimers();
    expect(accessor).toBe(getPostById(0));

    // should clear the cache if the accessor is not mounted.
    unmountAccessor();
    vi.runOnlyPendingTimers();
    expect(accessor).not.toBe(getPostById(0));
  });

  test('should not clear the cache if the infinite accessor is mounted', () => {
    const accessor = getPostList();
    const unmountAccessor = accessor.mount({ optionsRef: { ...optionsRef } });
    vi.runOnlyPendingTimers();

    expect(accessor).toBe(getPostList());
    vi.runOnlyPendingTimers();
    expect(accessor).toBe(getPostList());

    // should clear the cache if the accessor is not mounted.
    unmountAccessor();
    vi.runOnlyPendingTimers();
    expect(accessor).not.toBe(getPostList());
  });
});
