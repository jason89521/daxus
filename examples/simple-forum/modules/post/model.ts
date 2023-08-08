import type { Post } from '@/type';
import { createPaginationAdapter, createModel } from 'daxus';

export const postAdapter = createPaginationAdapter<Post>();

export const postModel = createModel({
  initialState: postAdapter.getInitialState(),
});
