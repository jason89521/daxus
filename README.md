# React Server Model (WIP)

Manage the server state and let user define the shape of the data from the server.

## Todo

### `useFetch`

- [x] Dedupe
- [x] Cache
- [x] Revalidate on focus
- [x] Revalidate when reconnect
- [x] Error retry
- [x] Error callback
- [x] Success callback
- [x] Mutation
- [ ] Testing
- [x] Only rerender when used field change

### `useInfiniteFetch`

- [x] Dedupe
- [x] Cache
- [x] Revalidate on focus
- [x] Revalidate when reconnect
- [x] Error retry
- [x] Error callback
- [x] Success callback
- [x] Mutation
- [ ] Testing
- [x] Only rerender when used field change

### `Dev Tool`

- [ ] Add dev tool like redux dev tool.

## Example

Create a pagination model

```ts
// in postModel.ts
import type { Action } from 'react-server-model';
import { Model, createPaginationAdapter } from 'react-server-model';

// createPaginationAdapter is an util function that which helps you to manage the pagination.
export const postAdapter = createPaginationAdapter<Post>({});
const initialModel = postAdapter.initialModel;

export const postModel = createModel(initialModel);

// Define a normal action.
export const getPostById = postModel.defineNormalAction({
  fetchData: async (id: number) => {
    const data = await getPostByIdRequest(id);
    return data;
  },
  syncModel: (draft, { data }) => {
    postAdapter.upsertOne(draft, data);
  },
});

// Define an infinite action. An infinite action means that it will fetch the list from the server.
export const getPostList = postModel.defineInfiniteAction<{ layout: PostLayout }, Post[]>({
  fetchData: async ({ layout }, { pageIndex, previousData }) => {
    if (previousData?.length === 0) return null;
    const data = await getPostListRequest({ layout, page: pageIndex });
    return data;
  },
  syncModel: (draft, { data, arg, pageIndex }) => {
    const paginationKey = JSON.stringify(arg);
    postAdapter.updatePagination(draft, { dataArray: data, paginationKey, pageIndex });
  },
});
```

Use the model with `useFetch` or `useInfiniteFetch`

```jsx
import { useFetch, useInfiniteFetch } from 'react-server-model';
import { getPostList, getPostById } from './postModel';

export function PostList() {
  const { data, fetchNextPage } = useInfiniteFetch(getPostList({ layout }), model => {
    const key = JSON.stringify({ layout });
    return postAdapter.getPagination(model, key);
  });

  return (
    <div>
      {data.map(post => {
        return (
          <div key={post.id}>
            <div>title: {post.title}</div>
          </div>
        );
      })}
      }
    </div>
  );
}

export function Post({ id }) {
  const { data } = useFetch(
    getPostById(id),
    model => {
      return model.data[id];
    },
    { revalidateOnFocus: false }
  );

  return <div>title: {data.title}</div>;
}
```
