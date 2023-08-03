import { db } from '@/database';
import type { Post } from '@/type';
import { createPaginationAdapter } from 'daxus';

export const postAdapter = createPaginationAdapter<Post>();

export const postModel = db.createModel({
  name: 'post',
  initialState: postAdapter.initialState,
});
