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

### `Model`

- [ ] Use the other method to serialize argument instead of using `JSON.stringify`.

### `Dev Tool`

- [ ] Add dev tool like redux dev tool.

## API

Create a model

```ts
import type { Action } from 'react-server-model';
import { Model, createPaginationAdapter } from 'react-server-model';

export const postAdapter = createPaginationAdapter<Post>({});
const initialModel = postAdapter.initialModel;

type PostModel = typeof initialModel;

const getPostById: Action<PostModel, number, Post> = {
  type: 'normal',
  fetchData: async id => {
    const data = await getPostByIdRequest(id);
    return data;
  },
  syncModel: (draft, { remoteData }) => {
    postAdapter.upsertOne(draft, remoteData);
  },
};

const getPostList: Action<PostModel, { layout: PostLayout }, Post[]> = {
  type: 'infinite',
  fetchData: async ({ layout }, { pageIndex }) => {
    const data = await getPostListRequest({ layout, page: pageIndex });
    return data;
  },
  syncModel: (draft, { remoteData, arg, pageIndex }) => {
    const paginationKey = JSON.stringify(arg);
    postAdapter.updatePagination(draft, { dataArray: remoteData, paginationKey, pageIndex });
  },
};

export const postModel = new Model(initialModel, { getPostById, getPostList });
```

Use the model with `useFetch` or `useInfiniteFetch`

```jsx
import { useFetch, useInfiniteFetch } from 'react-server-model';

export function PostList() {
  const { data, fetchNextPage } = useInfiniteFetch(
    postModel.accessorGetters.getPostList({ layout }),
    model => {
      const key = JSON.stringify({ layout });
      return postAdapter.getPagination(model, key);
    }
  );

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
    postModel.accessorGetters.getPostById(id),
    model => {
      return model.data[id];
    },
    { revalidateOnFocus: false }
  );

  return <div>title: {data.title}</div>;
}
```
